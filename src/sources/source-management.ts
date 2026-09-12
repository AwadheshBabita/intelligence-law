import type { SourceRecord, SourceStatus, VerificationStatus, SourceRole, Jurisdiction, AuthorityRank } from "../shared/types.js";
import type { UserRole } from "../auth/types.js";

// ============================================================
// Source Status Lifecycle
// ============================================================

export type SourceLifecycleStatus =
  | "registered_pending_manual_verification"
  | "in_review"
  | "verified"
  | "rejected"
  | "suspended"
  | "archived";

export interface SourceMetadata {
  readonly sourceId: string;
  readonly title: string;
  readonly authorityRank: AuthorityRank;
  readonly sourceStatus: SourceLifecycleStatus;
  readonly verificationStatus: VerificationStatus;
  readonly sourceRole: SourceRole;
  readonly officialUrl: string | null;
  readonly jurisdiction: Jurisdiction | null;
  readonly sourceVersionId: string | null;
  readonly sourceSnapshotId: string | null;
  readonly nextReviewDueAt: string | null;
  readonly verificationDate: string | null;
  readonly effectiveDate: string | null;
  readonly publicationDate: string | null;
  readonly lastCheckedAt: string;
  readonly lastVerifiedAt: string | null;
  readonly createdBy: string | null;
  readonly notes: string[];
  readonly relatedSources: string[];
}

// ============================================================
// Source Management Interface
// ============================================================

export interface SourceManagement {
  /**
   * Register a new source record.
   * Admin or content_reviewer can create; citizens cannot.
   */
  registerSource(source: Omit<SourceMetadata, "sourceId" | "lastCheckedAt" | "createdBy"> & { sourceId: string }): SourceMetadata;

  /**
   * Get a source by ID.
   */
  getSource(sourceId: string): SourceMetadata | null;

  /**
   * Get all sources, optionally filtered by status.
   */
  getAllSources(filters?: {
    sourceStatus?: SourceLifecycleStatus;
    verificationStatus?: VerificationStatus;
    authorityRank?: AuthorityRank;
    jurisdiction?: string;
  }): SourceMetadata[];

  /**
   * Update a source's verification status.
   * Only admin can move to verified/rejected; content_reviewer can move to in_review/suspended.
   */
  updateSourceVerification(
    sourceId: string,
    newStatus: VerificationStatus,
    changedBy: UserRole,
    notes?: string
  ): { source: SourceMetadata; ok: boolean; message: string };

  /**
   * Suspend a source.
   * Admin or content_reviewer can suspend.
   */
  suspendSource(sourceId: string, changedBy: UserRole, notes?: string): { source: SourceMetadata; ok: boolean; message: string };

  /**
   * Archive a source.
   * Only admin can archive.
   */
  archiveSource(sourceId: string, changedBy: UserRole, notes?: string): { source: SourceMetadata; ok: boolean; message: string };

  /**
   * Restore an archived source.
   * Only admin can restore.
   */
  restoreSource(sourceId: string, changedBy: UserRole, notes?: string): { source: SourceMetadata; ok: boolean; message: string };

  /**
   * Update source metadata (title, jurisdiction, notes, etc.).
   * Admin or content_reviewer can update.
   */
  updateSourceMetadata(
    sourceId: string,
    updates: Partial<Omit<SourceMetadata, "sourceId">>,
    changedBy: UserRole
  ): { source: SourceMetadata; ok: boolean; message: string };

  /**
   * Detect duplicate sources based on title, official URL, and jurisdiction.
   */
  detectDuplicateSources(sourceId?: string): { duplicates: SourceMetadata[]; message: string };

  /**
   * Get sources pending review - for admin/reviewer dashboard.
   */
  getPendingSources(): SourceMetadata[];

  /**
   * Get verified sources - for citizen-facing retrieval.
   */
  getVerifiedSources(): SourceMetadata[];

  /**
   * Get suspended sources.
   */
  getSuspendedSources(): SourceMetadata[];

  /**
   * Get archived sources.
   */
  getArchivedSources(): SourceMetadata[];
}

// ============================================================
// In-Memory Source Storage
// ============================================================

class InMemorySourceStorage implements SourceManagement {
  private sources: Map<string, SourceMetadata> = new Map();
  private nextSourceId = 1;

  constructor(initialSources: SourceMetadata[] = []) {
    for (const source of initialSources) {
      this.sources.set(source.sourceId, source);
      if (source.sourceId > `src-${String(this.nextSourceId).padStart(3, '0')}`) {
        this.nextSourceId = parseInt(source.sourceId.replace('src-', '')) + 1;
      }
    }
  }

  async registerSource(source: Omit<SourceMetadata, "sourceId" | "lastCheckedAt" | "createdBy"> & { sourceId: string }): SourceMetadata {
    // Check for duplicates
    const existing = this.sources.get(source.sourceId);
    if (existing) {
      throw new Error(`Source with ID ${source.sourceId} already exists`);
    }

    const now = new Date().toISOString();
    const metadata: SourceMetadata = {
      ...source,
      sourceId: source.sourceId,
      lastCheckedAt: now,
      createdBy: "admin", // will be overridden by actual user role
      notes: source.notes || [],
      relatedSources: source.relatedSources || [],
    };

    this.sources.set(source.sourceId, metadata);
    return metadata;
  }

  async getSource(sourceId: string): SourceMetadata | null {
    return this.sources.get(sourceId) || null;
  }

  async getAllSources(filters?: {
    sourceStatus?: SourceLifecycleStatus;
    verificationStatus?: VerificationStatus;
    authorityRank?: AuthorityRank;
    jurisdiction?: string;
  }): SourceMetadata[] {
    let results = Array.from(this.sources.values());

    if (filters) {
      if (filters.sourceStatus) {
        results = results.filter(s => s.sourceStatus === filters.sourceStatus);
      }
      if (filters.verificationStatus) {
        results = results.filter(s => s.verificationStatus === filters.verificationStatus);
      }
      if (filters.authorityRank) {
        results = results.filter(s => s.authorityRank === filters.authorityRank);
      }
      if (filters.jurisdiction) {
        results = results.filter(s => s.jurisdiction?.id === filters.jurisdiction);
      }
    }

    return results;
  }

  async updateSourceVerification(
    sourceId: string,
    newStatus: VerificationStatus,
    changedBy: UserRole,
    notes?: string
  ): { source: SourceMetadata; ok: boolean; message: string } {
    const source = await this.getSource(sourceId);
    if (!source) {
      return { source: {} as SourceMetadata, ok: false, message: "Source not found" };
    }

    // Check authorization
    const isAdmin = changedBy === "admin";
    const isReviewer = changedBy === "content_reviewer";

    // Only admin can move to verified/rejected directly
    // content_reviewer can move to in_review
    let currentStatus = source.verificationStatus;

    if (newStatus === "verified") {
      if (!isAdmin) {
        return { source, ok: false, message: "Only admin can verify a source to 'verified' status" };
      }
      // Verify source is Rank A and has required metadata
      if (source.authorityRank !== "A") {
        return { source, ok: false, message: "Only Rank A sources can be verified as publishable legal sources" };
      }
      if (!source.officialUrl) {
        return { source, ok: false, message: "Official URL is required for verification" };
      }
      if (!source.jurisdiction) {
        return { source, ok: false, message: "Jurisdiction is required for verification" };
      }
    }

    if (newStatus === "rejected") {
      if (!isAdmin && !isReviewer) {
        return { source, ok: false, message: "Only admin or content_reviewer can reject a source" };
      }
    }

    if (newStatus === "in_review") {
      if (!isAdmin && !isReviewer) {
        return { source, ok: false, message: "Only admin or content_reviewer can set source to 'in_review'" };
      }
    }

    if (newStatus === "suspended") {
      if (!isAdmin && !isReviewer) {
        return { source, ok: false, message: "Only admin or content_reviewer can suspend a source" };
      }
    }

    const oldStatus = source.verificationStatus;
    source.verificationStatus = newStatus;
    source.lastVerifiedAt = new Date().toISOString();

    // Update sourceStatus based on verification status
    if (newStatus === "verified") {
      source.sourceStatus = "verified";
    } else if (newStatus === "rejected") {
      source.sourceStatus = "rejected";
    }

    // Record audit information - update notes
    const auditNote = `Verification changed from ${oldStatus} to ${newStatus} by ${changedBy}${notes ? `: ${notes}` : ""}`;
    source.notes = [...(source.notes || []), auditNote];

    return { source, ok: true, message: `Source verification status updated from ${oldStatus} to ${newStatus}` };
  }

  async suspendSource(sourceId: string, changedBy: UserRole, notes?: string): { source: SourceMetadata; ok: boolean; message: string } {
    const source = await this.getSource(sourceId);
    if (!source) {
      return { source: {} as SourceMetadata, ok: false, message: "Source not found" };
    }

    // Check authorization: admin or content_reviewer can suspend
    const isAdmin = changedBy === "admin";
    const isReviewer = changedBy === "content_reviewer";
    if (!isAdmin && !isReviewer) {
      return { source, ok: false, message: "Only admin or content_reviewer can suspend a source" };
    }

    const oldStatus = source.sourceStatus;
    source.sourceStatus = "suspended";
    source.lastVerifiedAt = new Date().toISOString();

    const auditNote = `Source suspended by ${changedBy}${notes ? `: ${notes}` : ""}`;
    source.notes = [...(source.notes || []), auditNote];

    return { source, ok: true, message: `Source suspended successfully` };
  }

  async archiveSource(sourceId: string, changedBy: UserRole, notes?: string): { source: SourceMetadata; ok: boolean; message: string } {
    const source = await this.getSource(sourceId);
    if (!source) {
      return { source: {} as SourceMetadata, ok: false, message: "Source not found" };
    }

    // Check authorization: only admin can archive
    if (changedBy !== "admin") {
      return { source, ok: false, message: "Only admin can archive a source" };
    }

    const oldStatus = source.sourceStatus;
    source.sourceStatus = "archived";
    source.lastVerifiedAt = new Date().toISOString();

    const auditNote = `Source archived by ${changedBy}${notes ? `: ${notes}` : ""}`;
    source.notes = [...(source.notes || []), auditNote];

    return { source, ok: true, message: `Source archived successfully` };
  }

  async restoreSource(sourceId: string, changedBy: UserRole, notes?: string): { source: SourceMetadata; ok: boolean; message: string } {
    const source = await this.getSource(sourceId);
    if (!source) {
      return { source: {} as SourceMetadata, ok: false, message: "Source not found" };
    }

    // Check authorization: only admin can restore
    if (changedBy !== "admin") {
      return { source, ok: false, message: "Only admin can restore an archived source" };
    }

    const oldStatus = source.sourceStatus;
    source.sourceStatus = "verified"; // Restore back to verified
    source.lastVerifiedAt = new Date().toISOString();

    const auditNote = `Source restored from archived by ${changedBy}${notes ? `: ${notes}` : ""}`;
    source.notes = [...(source.notes || []), auditNote];

    return { source, ok: true, message: `Source restored successfully` };
  }

  async updateSourceMetadata(
    sourceId: string,
    updates: Partial<Omit<SourceMetadata, "sourceId">>,
    changedBy: UserRole
  ): { source: SourceMetadata; ok: boolean; message: string } {
    const source = await this.getSource(sourceId);
    if (!source) {
      return { source: {} as SourceMetadata, ok: false, message: "Source not found" };
    }

    // Check authorization: admin or content_reviewer can update
    const isAdmin = changedBy === "admin";
    const isReviewer = changedBy === "content_reviewer";
    if (!isAdmin && !isReviewer) {
      return { source, ok: false, message: "Only admin or content_reviewer can update source metadata" };
    }

    const updated = { ...source, ...updates, lastUpdated: new Date().toISOString() };
    this.sources.set(sourceId, updated);

    // Record audit note
    const auditNote = `Source metadata updated by ${changedBy}`;
    source.notes = [...(source.notes || []), auditNote];

    return { source: updated, ok: true, message: "Source metadata updated successfully" };
  }

  async detectDuplicateSources(sourceId?: string): { duplicates: SourceMetadata[]; message: string } {
    const all = Array.from(this.sources.values());
    const duplicates: SourceMetadata[] = [];

    // Group by title + officialUrl + jurisdiction
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i];
        const b = all[j];

        const isDuplicate = 
          a.title === b.title &&
          a.officialUrl === b.officialUrl &&
          a.jurisdiction?.id === b.jurisdiction?.id &&
          a.sourceId !== b.sourceId;

        if (isDuplicate && !duplicates.includes(a) && !duplicates.includes(b)) {
          duplicates.push(a, b);
        }
      }
    }

    if (duplicates.length === 0) {
      return { duplicates: [], message: "No duplicate sources detected" };
    }

    return { duplicates, message: `${duplicates.length} duplicate source(s) detected` };
  }

  async getPendingSources(): SourceMetadata[] {
    return this.getAllSources({ sourceStatus: "registered_pending_manual_verification" });
  }

  async getVerifiedSources(): SourceMetadata[] {
    return this.getAllSources({ verificationStatus: "verified", sourceStatus: "verified" });
  }

  async getSuspendedSources(): SourceMetadata[] {
    return this.getAllSources({ sourceStatus: "suspended" });
  }

  async getArchivedSources(): SourceMetadata[] {
    return this.getAllSources({ sourceStatus: "archived" });
  }
}

// Export a ready instance
export const sourceStorage = new InMemorySourceStorage();

// Initialize with existing source data from India Code registry
const initialSourcesFromRegistry = [
  {
    sourceId: "src-india-code-constitution-of-india",
    title: "Constitution of India",
    authorityRank: "A",
    sourceStatus: "registered_pending_manual_verification",
    verificationStatus: "in_review",
    sourceRole: "discovery_source",
    officialUrl: "https://www.indiacode.nic.in/handle/123456789/16124",
    jurisdiction: { id: "IN", kind: "country", name: "India", parentId: null },
    sourceVersionId: null,
    sourceSnapshotId: null,
    nextReviewDueAt: null,
    verificationDate: null,
    effectiveDate: null,
    publicationDate: null,
    lastCheckedAt: new Date().toISOString(),
    lastVerifiedAt: null,
    createdBy: null,
    notes: [
      "The source record is registered from the user-supplied India Code URL.",
      "No amendment status, effective date, version, source snapshot, or provision-level commencement is inferred."
    ],
    relatedSources: [],
  } as SourceMetadata,
  {
    sourceId: "src-india-code-bharatiya-nyaya-sanhita-2023",
    title: "Bharatiya Nyaya Sanhita, 2023",
    authorityRank: "A",
    sourceStatus: "registered_pending_manual_verification",
    verificationStatus: "in_review",
    sourceRole: "discovery_source",
    officialUrl: "https://www.indiacode.nic.in/indiacode/handle/123456789/20062?col=123456789%2F1362&view_type=search",
    jurisdiction: { id: "IN", kind: "country", name: "India", parentId: null },
    sourceVersionId: null,
    sourceSnapshotId: null,
    nextReviewDueAt: null,
    verificationDate: null,
    effectiveDate: null,
    publicationDate: null,
    lastCheckedAt: new Date().toISOString(),
    lastVerifiedAt: null,
    createdBy: null,
    notes: [
      "Act metadata and dates are recorded from user-supplied input and await manual source verification.",
      "The known enforcement date is recorded only at Act level; no provision-level commencement is inferred."
    ],
    relatedSources: [],
  } as SourceMetadata,
  {
    sourceId: "src-india-code-bharatiya-nagarik-suraksha-sanhita-2023",
    title: "Bharatiya Nagarik Suraksha Sanhita, 2023",
    authorityRank: "A",
    sourceStatus: "registered_pending_manual_verification",
    verificationStatus: "in_review",
    sourceRole: "discovery_source",
    officialUrl: "https://www.indiacode.nic.in/handle/123456789/20099?view_type=browse",
    jurisdiction: { id: "IN", kind: "country", name: "India", parentId: null },
    sourceVersionId: null,
    sourceSnapshotId: null,
    nextReviewDueAt: null,
    verificationDate: null,
    effectiveDate: null,
    publicationDate: null,
    lastCheckedAt: new Date().toISOString(),
    lastVerifiedAt: null,
    createdBy: null,
    notes: [
      "Act metadata and dates are recorded from user-supplied input and await manual source verification.",
      "The known enforcement date is recorded only at Act level; no provision-level commencement is inferred."
    ],
    relatedSources: [],
  } as SourceMetadata,
  {
    sourceId: "src-india-code-bharatiya-sakshya-adhiniyam-2023",
    title: "Bharatiya Sakshya Adhiniyam, 2023",
    authorityRank: "A",
    sourceStatus: "registered_pending_manual_verification",
    verificationStatus: "in_review",
    sourceRole: "discovery_source",
    officialUrl: "https://www.indiacode.nic.in/indiacode/handle/123456789/20063?view_type=browse",
    jurisdiction: { id: "IN", kind: "country", name: "India", parentId: null },
    sourceVersionId: null,
    sourceSnapshotId: null,
    nextReviewDueAt: null,
    verificationDate: null,
    effectiveDate: null,
    publicationDate: null,
    lastCheckedAt: new Date().toISOString(),
    lastVerifiedAt: null,
    createdBy: null,
    notes: [
      "Act metadata and dates are recorded from user-supplied input and await manual source verification.",
      "The known enforcement date is recorded only at Act level; no provision-level commencement is inferred."
    ],
    relatedSources: [],
  } as SourceMetadata,
];

// Initialize the storage with existing registry data
for (const source of initialSourcesFromRegistry) {
  sourceStorage.registerSource(source);
}