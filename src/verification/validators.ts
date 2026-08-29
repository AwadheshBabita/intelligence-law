import { isIsoDate, resultFrom } from "../shared/validation.js";
import type { Citation, EffectivePeriod, Jurisdiction, MatterRecord, SourceRecord, ValidationIssue, ValidationResult } from "../shared/types.js";
import { isCurrentLawEligibleSource, isRankAOfficialSource } from "../sources/source-registry.js";

export function validateSourceRank(source: SourceRecord): ValidationResult {
  return isRankAOfficialSource(source)
    ? resultFrom([])
    : resultFrom([{ code: "SOURCE_NOT_RANK_A", message: "Only Rank A official sources can become publishable legal sources." }]);
}

export function validateSourceStatus(source: SourceRecord, asOfDate: string): ValidationResult {
  return isCurrentLawEligibleSource(source, asOfDate)
    ? resultFrom([])
    : resultFrom([{ code: "SOURCE_NOT_CURRENT_ELIGIBLE", message: "Source is not verified, current, publishable, or fully identified for the requested date." }]);
}

export function validateJurisdiction(jurisdiction: Jurisdiction | null): ValidationResult {
  if (jurisdiction === null) return resultFrom([{ code: "JURISDICTION_UNKNOWN", message: "Jurisdiction must be known before publication." }]);
  if (jurisdiction.id.trim() === "" || jurisdiction.name.trim() === "") {
    return resultFrom([{ code: "JURISDICTION_INCOMPLETE", message: "Jurisdiction requires a stable identifier and name." }]);
  }
  return resultFrom([]);
}

export function validateEffectivePeriod(period: EffectivePeriod): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (period.status !== "verified") issues.push({ code: "EFFECTIVE_PERIOD_NOT_VERIFIED", message: "A current-law assertion requires a verified effective period." });
  if (period.effectiveFrom === null || !isIsoDate(period.effectiveFrom)) issues.push({ code: "EFFECTIVE_FROM_UNKNOWN", message: "Effective start date must be known and ISO formatted for a current-law assertion." });
  if (period.effectiveTo !== null && !isIsoDate(period.effectiveTo)) issues.push({ code: "EFFECTIVE_TO_INVALID", message: "Effective end date must be ISO formatted when present." });
  if (period.effectiveFrom !== null && period.effectiveTo !== null && period.effectiveTo < period.effectiveFrom) {
    issues.push({ code: "EFFECTIVE_RANGE_INVALID", message: "Effective end date cannot precede effective start date." });
  }
  if (period.jurisdictionId.trim() === "") issues.push({ code: "EFFECTIVE_JURISDICTION_UNKNOWN", message: "Effective period requires a jurisdiction." });
  return resultFrom(issues);
}

export function validateCitationCompleteness(citation: Citation, asOfDate: string): ValidationResult {
  const issues: ValidationIssue[] = [];
  for (const result of [validateSourceRank(citation.source), validateSourceStatus(citation.source, asOfDate), validateJurisdiction(citation.source.jurisdiction), validateEffectivePeriod(citation.effectivePeriod)]) {
    if (!result.ok) issues.push(...result.issues);
  }
  if (citation.span.sourceId !== citation.source.sourceId) issues.push({ code: "CITATION_SOURCE_MISMATCH", message: "Citation span must reference the same source." });
  if (citation.span.sourceVersionId !== citation.source.sourceVersionId) issues.push({ code: "CITATION_VERSION_MISMATCH", message: "Citation span must reference the registered source version." });
  if (citation.span.sourceSnapshotId !== citation.source.sourceSnapshotId) issues.push({ code: "CITATION_SNAPSHOT_MISMATCH", message: "Citation span must reference the registered source snapshot." });
  if (citation.span.locator.trim() === "") issues.push({ code: "CITATION_LOCATOR_MISSING", message: "A document-level citation is insufficient; an exact locator is required." });
  return resultFrom(issues);
}

export function validateMatterSeparation(record: MatterRecord): ValidationResult {
  if (record.kind === "analysis" && record.sourceRecordId === null) {
    return resultFrom([{ code: "ANALYSIS_SOURCE_MISSING", message: "Legal analysis must identify its source-backed inputs separately." }]);
  }
  if (record.kind === "uncertainty" && (record.uncertaintyReason === null || record.uncertaintyReason.trim() === "")) {
    return resultFrom([{ code: "UNCERTAINTY_REASON_MISSING", message: "Uncertainty records require an explicit reason." }]);
  }
  return resultFrom([]);
}
