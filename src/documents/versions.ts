import type { Citation, ProvisionLineage } from "../shared/types.js";

export interface DocumentVersion {
  readonly versionId: string;
  readonly sourceId: string;
  readonly predecessorVersionId: string | null;
  readonly effectiveFrom: string | null;
  readonly effectiveTo: string | null;
}

export interface AmendmentEffect {
  readonly amendmentSourceId: string;
  readonly affectedVersionId: string;
  readonly successorVersionId: string;
  readonly provisionLineage: ProvisionLineage;
  readonly effectiveCitation: Citation;
}

/** A successor is additive; callers must retain the predecessor version unchanged. */
export function createSuccessorVersion(prior: DocumentVersion, successor: Omit<DocumentVersion, "predecessorVersionId">): DocumentVersion {
  if (prior.sourceId !== successor.sourceId) throw new Error("A successor version must belong to the same source.");
  if (prior.versionId === successor.versionId) throw new Error("A successor version requires a new immutable version identifier.");
  return Object.freeze({ ...successor, predecessorVersionId: prior.versionId });
}
