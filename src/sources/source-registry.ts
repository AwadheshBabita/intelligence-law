import type { SourceRecord } from "../shared/types.js";

export function isRankAOfficialSource(source: SourceRecord): boolean {
  return source.authorityRank === "A" && source.officialUrl !== null;
}

export function isCurrentLawEligibleSource(source: SourceRecord, asOfDate: string): boolean {
  return isRankAOfficialSource(source)
    && source.sourceStatus === "verified"
    && source.verificationStatus === "verified"
    && source.sourceRole === "published_legal_source"
    && source.sourceVersionId !== null
    && source.sourceSnapshotId !== null
    && source.jurisdiction !== null
    && source.nextReviewDueAt !== null
    && source.nextReviewDueAt >= asOfDate;
}
