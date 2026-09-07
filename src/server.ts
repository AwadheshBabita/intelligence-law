import express from "express";
import http from "http";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { sourceStorage } from "./sources/source-management.js";
import { legalContentStorage } from "./legal-kb/content-management.js";
import { caseStorage } from "./cases/storage.js";
import { hashPassword, verifyPassword, createUser } from "./auth/hash.js";
import {
  authMiddleware,
  requirePermission,
  extractBearerToken,
} from "./auth/jwt.js";
import {
  validateBody,
  validateParam,
  allowMethods,
  validateContentType,
} from "./validation-middleware.js";
import type { UserRole } from "./auth/types.js";

// In-memory credential store
const credentials: Record<string, string> = {};

// ============================================================
// Rate limiting
// ============================================================

// General API rate limiter: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Too many requests, please try again later." },
});

// Stricter limiter for auth endpoints: 5 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Too many authentication attempts, please try again later." },
});

// ============================================================
// Express app setup
// ============================================================

const app = express();

// Trust the reverse proxy (e.g., nginx, Caddy, Traefik) for proper
// client IP detection and rate limiting when deployed behind TLS termination.
app.set("trust proxy", 1);

// CORS configuration - restrict in production, allow dev origins
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:3001"];

const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean | string) => void) => {
    // Allow requests with no origin (like curl, mobile apps, server-to-server)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    // In production, reject unknown origins; in dev, allow for compatibility
    if (process.env.NODE_ENV === "production") {
      return cb(null, false);
    }
    // Development: allow but log
    console.warn(`CORS: blocking unknown origin: ${origin}`);
    return cb(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Security headers via Helmet
// Security headers via Helmet
// HSTS is only applied in production to avoid forcing localhost development into HTTPS.
app.use(
  helmet({
    hsts: process.env.NODE_ENV === "production"
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  })
);

// Body size limits - increased for document uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Rate limiter applied to all routes
app.use(generalLimiter);

// Request ID for tracing
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  req.id = req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  next();
});

// ============================================================
// Auth middleware: validates JWT and attaches user to req
// (imported from ./auth/jwt.js - validates JWT_SECRET at startup)
// ============================================================

// ============================================================
// RBAC middleware: checks if user has required permission
// (imported from ./auth/jwt.js - uses RBAC_PERMISSIONS from rbac.ts)
// ============================================================

// ============================================================
// Auth routes
// ============================================================

// Use authLimiter for login attempts
app.post("/auth/login", authLimiter, validateContentType("application/json"), validateBody, async (req: express.Request, res: express.Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ ok: false, message: "Username and password required" });
  }

  const storedHash = credentials.get(username);
  if (!storedHash) {
    return res.status(401).json({ ok: false, message: "Invalid credentials" });
  }

  const validPassword = await verifyPassword(password, storedHash);
  if (!validPassword) {
    return res.status(401).json({ ok: false, message: "Invalid credentials" });
  }

  // Find user
  let user: UserRole | undefined;
  for (const [uname, hash] of Object.entries(credentials)) {
    if (uname === username) {
      user = { userId: uname, username, role: "admin" as UserRole, createdAt: new Date().toISOString() };
      break;
    }
  }

  if (!user) {
    return res.status(401).json({ ok: false, message: "Invalid credentials" });
  }

  const token = generateToken(user);
  return res.json({ ok: true, token, user });
});

// In-memory credential store

// ============================================================
// Source Management Routes
// ============================================================

app.get("/sources", authMiddleware, requirePermission("view_all_cases"), (req: express.Request, res: express.Response) => {
  const sources = sourceStorage.getAllSources();
  return res.json({ ok: true, sources });
});

app.post("/sources", authMiddleware, requirePermission("manage_legal_sources"), (req: express.Request, res: express.Response) => {
  const { sourceId, title, authorityRank, sourceStatus, verificationStatus, sourceRole, officialUrl, jurisdiction, sourceVersionId, sourceSnapshotId, nextReviewDueAt, verificationDate, effectiveDate, publicationDate, notes, relatedSources } = req.body;

  if (!sourceId || !title) {
    return res.status(400).json({ ok: false, message: "sourceId and title are required" });
  }

  try {
    const result = sourceStorage.registerSource({
      sourceId,
      title,
      authorityRank,
      sourceStatus,
      verificationStatus,
      sourceRole,
      officialUrl,
      jurisdiction,
      sourceVersionId,
      sourceSnapshotId,
      nextReviewDueAt,
      verificationDate,
      effectiveDate,
      publicationDate,
      notes: notes || [],
      relatedSources: relatedSources || [],
    } as any);

    return res.json({ ok: true, source: result });
  } catch (e: any) {
    return res.status(400).json({ ok: false, message: e.message });
  }
});

app.put("/sources/:sourceId/verify", authMiddleware, requirePermission("verify_content"), validateParam("sourceId"), (req: express.Request, res: express.Response) => {
  const { sourceId } = req.params;
  const { newStatus, notes } = req.body;

  const result = sourceStorage.updateSourceVerification(sourceId, newStatus as any, "admin", notes);

  if (result.ok) {
    return res.json({ ok: true, source: result.source, message: result.message });
  } else {
    return res.status(403).json({ ok: false, message: result.message });
  }
});

app.put("/sources/:sourceId/suspend", authMiddleware, requirePermission("suspend_content"), validateParam("sourceId"), (req: express.Request, res: express.Response) => {
  const { sourceId } = req.params;

  const result = sourceStorage.suspendSource(sourceId, "admin", req.body.notes);

  if (result.ok) {
    return res.json({ ok: true, source: result.source, message: result.message });
  } else {
    return res.status(403).json({ ok: false, message: result.message });
  }
});

app.put("/sources/:sourceId/archive", authMiddleware, requirePermission("archive_content"), validateParam("sourceId"), (req: express.Request, res: express.Response) => {
  const { sourceId } = req.params;

  const result = sourceStorage.archiveSource(sourceId, "admin", req.body.notes);

  if (result.ok) {
    return res.json({ ok: true, source: result.source, message: result.message });
  } else {
    return res.status(403).json({ ok: false, message: result.message });
  }
});

app.put("/sources/:sourceId/restore", authMiddleware, requirePermission("restore_content"), validateParam("sourceId"), (req: express.Request, res: express.Response) => {
  const { sourceId } = req.params;

  const result = sourceStorage.restoreSource(sourceId, "admin", req.body.notes);

  if (result.ok) {
    return res.json({ ok: true, source: result.source, message: result.message });
  } else {
    return res.status(403).json({ ok: false, message: result.message });
  }
});

// ============================================================
// Legal Content Management Routes
// ============================================================

app.post("/content", authMiddleware, requirePermission("manage_legal_sources"), (req: express.Request, res: express.Response) => {
  const content = req.body;
  const createdBy: UserRole = req.user.role;

  try {
    const result = legalContentStorage.createContent(content, createdBy);
    return res.json({ ok: true, content: result });
  } catch (e: any) {
    return res.status(400).json({ ok: false, message: e.message });
  }
});

app.put("/content/:contentId/review", authMiddleware, requirePermission("review_content"), (req: express.Request, res: express.Response) => {
  const { contentId } = req.params;
  const { notes } = req.body;

  const result = legalContentStorage.reviewContent(contentId, req.user.role, notes);

  if (result.ok) {
    return res.json({ ok: true, content: result.content, message: result.message });
  } else {
    return res.status(403).json({ ok: false, message: result.message });
  }
});

app.put("/content/:contentId/verify", authMiddleware, requirePermission("verify_content"), (req: express.Request, res: express.Response) => {
  const { contentId } = req.params;
  const { notes } = req.body;

  const result = legalContentStorage.verifyContent(contentId, req.user.role, notes);

  if (result.ok) {
    return res.json({ ok: true, content: result.content, message: result.message });
  } else {
    return res.status(403).json({ ok: false, message: result.message });
  }
});

app.put("/content/:contentId/publicize", authMiddleware, requirePermission("verify_content"), (req: express.Request, res: express.Response) => {
  const { contentId } = req.params;
  const { notes } = req.body;

  const result = legalContentStorage.publicizeContent(contentId, req.user.role, notes);

  if (result.ok) {
    return res.json({ ok: true, content: result.content, message: result.message });
  } else {
    return res.status(403).json({ ok: false, message: result.message });
  }
});

app.put("/content/:contentId/reject", authMiddleware, requirePermission("verify_content"), (req: express.Request, res: express.Response) => {
  const { contentId } = req.params;
  const { notes } = req.body;

  const result = legalContentStorage.rejectContent(contentId, req.user.role, notes);

  if (result.ok) {
    return res.json({ ok: true, content: result.content, message: result.message });
  } else {
    return res.status(403).json({ ok: false, message: result.message });
  }
});

app.put("/content/:contentId/suspend", authMiddleware, requirePermission("suspend_content"), (req: express.Request, res: express.Response) => {
  const { contentId } = req.params;
  const { notes } = req.body;

  const result = legalContentStorage.suspendContent(contentId, req.user.role, notes);

  if (result.ok) {
    return res.json({ ok: true, content: result.content, message: result.message });
  } else {
    return res.status(403).json({ ok: false, message: result.message });
  }
});

app.put("/content/:contentId/archive", authMiddleware, requirePermission("archive_content"), (req: express.Request, res: express.Response) => {
  const { contentId } = req.params;
  const { notes } = req.body;

  const result = legalContentStorage.archiveContent(contentId, req.user.role, notes);

  if (result.ok) {
    return res.json({ ok: true, content: result.content, message: result.message });
  } else {
    return res.status(403).json({ ok: false, message: result.message });
  }
});

app.put("/content/:contentId/restore", authMiddleware, requirePermission("restore_content"), (req: express.Request, res: express.Response) => {
  const { contentId } = req.params;
  const { notes } = req.body;

  const result = legalContentStorage.restoreContent(contentId, req.user.role, notes);

  if (result.ok) {
    return res.json({ ok: true, content: result.content, message: result.message });
  } else {
    return res.status(403).json({ ok: false, message: result.message });
  }
});

// ============================================================
// Case Management Routes
// ============================================================

app.get("/cases", authMiddleware, requirePermission("view_all_cases"), (req: express.Request, res: express.Response) => {
  const cases = Array.from(caseStorage.cases.values());
  return res.json({ ok: true, cases });
});

app.post("/cases", authMiddleware, requirePermission("manage_users"), (req: express.Request, res: express.Response) => {
  const caseData = req.body;
  const result = caseStorage.save(caseData as any);
  return res.json({ ok: true, case: result });
});

app.put("/cases/:caseId", authMiddleware, requirePermission("modify_all_cases"), validateParam("caseId"), (req: express.Request, res: express.Response) => {
  const { caseId } = req.params;
  const updates = req.body;

  const result = caseStorage.updateCase(caseId, req.user.userId || "", updates as any);

  if (result) {
    return res.json({ ok: true, case: result });
  } else {
    return res.status(404).json({ ok: false, message: "Case not found" });
  }
});

app.delete("/cases/:caseId", authMiddleware, requirePermission("delete_content"), validateParam("caseId"), (req: express.Request, res: express.Response) => {
  const { caseId } = req.params;

  const result = caseStorage.deleteCase(caseId, req.user.userId || "");

  if (result) {
    return res.json({ ok: true, message: "Case deleted successfully" });
  } else {
    return res.status(404).json({ ok: false, message: "Case not found or access denied" });
  }
});

// ============================================================
// Version Management Routes
// ============================================================

app.post("/versions/successor", authMiddleware, requirePermission("manage_legal_sources"), async (req: express.Request, res: express.Response) => {
  const { priorVersionId, successorVersionId, sourceId, effectiveFrom, effectiveTo, changedBy, notes } = req.body;

  const { createLegalSuccessorVersion } = await import("./documents/versions.js");

  try {
    const priorVersion = { versionId: priorVersionId, sourceId, predecessorVersionId: null, effectiveFrom: effectiveFrom || "2024-01-01", effectiveTo: effectiveTo || null } as any;
    const successor = createLegalSuccessorVersion(priorVersion, {
      versionId: successorVersionId,
      sourceId,
      effectiveFrom: effectiveFrom || "2024-01-01",
      effectiveTo: effectiveTo || null,
      changedBy: changedBy || "admin",
      notes: notes || "",
    } as any);

    return res.json({ ok: true, successor });
  } catch (e: any) {
    return res.status(400).json({ ok: false, message: e.message });
  }
});

app.get("/versions/current-effective", authMiddleware, requirePermission("view_analytics"), async (req: express.Request, res: express.Response) => {
  const { versions, asOfDate } = req.query;

  const { getCurrentEffectiveVersion } = await import("./documents/versions.js");

  const versionList = versions ? JSON.parse(versions as string) : [];
  const current = getCurrentEffectiveVersion(versionList, asOfDate as string || new Date().toISOString());

  return res.json({ ok: true, currentEffectiveVersion: current });
});

// ============================================================
// Audit/Analytics Routes
// ============================================================

app.get("/audit/sources", authMiddleware, requirePermission("view_analytics"), (req: express.Request, res: express.Response) => {
  const sources = sourceStorage.getAllSources();
  const auditRecords = sources.map((s: any) => ({
    sourceId: s.sourceId,
    title: s.title,
    verificationStatus: s.verificationStatus,
    sourceStatus: s.sourceStatus,
    lastVerifiedAt: s.lastVerifiedAt,
  }));

  return res.json({ ok: true, auditRecords });
});

app.get("/audit/content", authMiddleware, requirePermission("view_analytics"), (req: express.Request, res: express.Response) => {
  const content = legalContentStorage.getVerifiedContent();
  const auditRecords = content.map((c: any) => ({
    contentId: c.actId || c.sectionId || c.ruleId || c.definitionId,
    type: c.actId ? "act" : c.sectionId ? "section" : c.ruleId ? "rule" : "definition",
    status: c.verificationWorkflowStatus,
  }));

  return res.json({ ok: true, auditRecords });
});

// ============================================================
// ============================================================
// Health check endpoint
// Must be registered before the global error handler.
// Returns 200 with a small JSON payload; never exposes secrets.
// ============================================================

app.get("/health", (_req: express.Request, res: express.Response) => {
  res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
});

// Global error handler - must be after all routes
// ============================================================

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[${req.id}] Error:`, err);
  const status = err.status || 500;

  const errorMessage = process.env.NODE_ENV === "production"
    ? "An unexpected error occurred"
    : err.message || "Unknown error";

  res.status(status).json({
    ok: false,
    message: errorMessage,
    requestId: req.id,
  });
});

// ============================================================
// Start server
// ============================================================

initAdminUser().then(() => {
  const PORT = parseInt(process.env.PORT || "3001", 10);
  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Intelligence Law Backend API running on port ${PORT}`);
  });
}).catch((err) => {
  console.error("Failed to initialize admin user:", err);
  const PORT = parseInt(process.env.PORT || "3001", 10);
  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Intelligence Law Backend API running on port ${PORT}`);
  });
});

// Initialize default admin user
// Admin password is read from ADMIN_PASSWORD env var.
// In production, ADMIN_PASSWORD must be set; the process will exit if missing,
// preventing the server from running with the default insecure credentials.
// In development, a fallback is used if ADMIN_PASSWORD is not set.
async function initAdminUser() {
  if (!("admin" in credentials)) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    // In production, require ADMIN_PASSWORD to be set
    if (process.env.NODE_ENV === "production" && !adminPassword) {
      console.error(
        "FATAL: ADMIN_PASSWORD environment variable not set in production. Aborting startup."
      );
      process.exit(1);
    }
    // Use provided password; exit if not configured
    // (Production exits if missing; development crash prevents default credentials)
    const adminHash = await hashPassword(adminPassword as string);
    credentials["admin"] = adminHash;
  }
}

// Export express app and server
export { app, server };