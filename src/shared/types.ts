export type AuthorityRank = "A" | "B" | "C" | "D" | "E";

export type SourceStatus =
  | "draft"
  | "in_review"
  | "verified"
  | "stale"
  | "superseded"
  | "disputed"
  | "withdrawn"
  | "revoked"
  | "unavailable"
  | "broken_link"
  | "registered_pending_manual_verification";

export type VerificationStatus = "unverified" | "in_review" | "verified" | "rejected";
export type SourceRole = "discovery_source" | "authoritative_source" | "verification_evidence" | "published_legal_source";
export type JurisdictionKind = "country" | "state" | "union_territory" | "local" | "court";
export type MatterKind = "allegation" | "claim" | "reported_fact" | "verified_fact" | "evidence" | "analysis" | "uncertainty";
export type ProvisionKind = "constitution_provision" | "chapter" | "section" | "sub_section" | "clause" | "sub_clause" | "definition" | "other";
export type LineageOperation = "continues_as" | "renumbered_to" | "substituted_by" | "split_into" | "merged_into" | "omitted_by" | "repealed_by" | "restored_by" | "moved_to" | "corrected_by";

export interface Jurisdiction {
  readonly id: string;
  readonly kind: JurisdictionKind;
  readonly name: string;
  readonly parentId: string | null;
}

export interface SourceRecord {
  readonly sourceId: string;
  readonly title: string;
  readonly authorityRank: AuthorityRank;
  readonly sourceStatus: SourceStatus;
  readonly verificationStatus: VerificationStatus;
  readonly sourceRole: SourceRole;
  readonly officialUrl: string | null;
  readonly jurisdiction: Jurisdiction | null;
  readonly sourceVersionId: string | null;
  readonly sourceSnapshotId: string | null;
  readonly nextReviewDueAt: string | null;
}

export interface SourceSpan {
  readonly sourceId: string;
  readonly sourceVersionId: string;
  readonly sourceSnapshotId: string;
  readonly locatorType: "gazette" | "page" | "paragraph" | "section" | "other";
  readonly locator: string;
  readonly extractedTextStart: number | null;
  readonly extractedTextEnd: number | null;
  readonly extractionRunId: string | null;
}

export interface EffectivePeriod {
  readonly effectiveFrom: string | null;
  readonly effectiveTo: string | null;
  readonly jurisdictionId: string;
  readonly status: "verified" | "disputed" | "unknown";
}

export interface Citation {
  readonly source: SourceRecord;
  readonly span: SourceSpan;
  readonly effectivePeriod: EffectivePeriod;
}

export interface ProvisionRecord {
  readonly provisionId: string;
  readonly logicalProvisionId: string;
  readonly provisionKind: ProvisionKind;
  readonly sourceLabel: string;
  readonly text: string | null;
  readonly citation: Citation;
}

export interface ProvisionLineage {
  readonly lineageId: string;
  readonly operation: LineageOperation;
  readonly priorProvisionId: string | null;
  readonly successorProvisionIds: readonly string[];
  readonly amendmentCitation: Citation;
}

export interface MatterRecord {
  readonly recordId: string;
  readonly kind: MatterKind;
  readonly content: string;
  readonly sourceRecordId: string | null;
  readonly uncertaintyReason: string | null;
}

export interface ValidationIssue {
  readonly code: string;
  readonly message: string;
}

export type ValidationResult =
  | { readonly ok: true; readonly issues: readonly [] }
  | { readonly ok: false; readonly issues: readonly ValidationIssue[] };
