import type { ProvisionRecord, SourceRecord, SourceSpan } from "../shared/types.js";

export interface ProvisionExtractionCandidate {
  readonly provisionId: string;
  readonly logicalProvisionId: string;
  readonly sourceLabel: string;
  readonly source: SourceRecord;
  readonly span: SourceSpan;
  readonly extractedText: string | null;
}

/**
 * Extraction produces an unverified candidate only. It cannot infer text, numbering,
 * citation details, or legal meaning when a source span is absent.
 */
export function createProvisionCandidate(candidate: ProvisionExtractionCandidate): Readonly<ProvisionExtractionCandidate> {
  if (candidate.source.sourceId !== candidate.span.sourceId) throw new Error("Provision source and source span must match.");
  if (candidate.source.sourceVersionId !== candidate.span.sourceVersionId) throw new Error("Provision source version and span must match.");
  if (candidate.source.sourceSnapshotId !== candidate.span.sourceSnapshotId) throw new Error("Provision snapshot and span must match.");
  return Object.freeze({ ...candidate });
}

export type ReviewedProvision = ProvisionRecord;
