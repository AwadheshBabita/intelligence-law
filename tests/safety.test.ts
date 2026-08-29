import { createSuccessorVersion, type DocumentVersion } from "../src/documents/versions.js";
import { retrieveSourceGroundedProvisions } from "../src/retrieval/source-grounded-retrieval.js";
import type { Citation, ProvisionRecord, SourceRecord } from "../src/shared/types.js";
import { validateCitationCompleteness, validateEffectivePeriod, validateJurisdiction, validateMatterSeparation, validateSourceRank, validateSourceStatus } from "../src/verification/validators.js";

function expect(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const source: SourceRecord = {
  sourceId: "source-demo",
  title: "Fictional verified source metadata only",
  authorityRank: "A",
  sourceStatus: "verified",
  verificationStatus: "verified",
  sourceRole: "published_legal_source",
  officialUrl: "https://example.invalid/source",
  jurisdiction: { id: "jur-india", kind: "country", name: "India", parentId: null },
  sourceVersionId: "version-demo-1",
  sourceSnapshotId: "snapshot-demo-1",
  nextReviewDueAt: "2030-01-01"
};

const citation: Citation = {
  source,
  span: {
    sourceId: "source-demo",
    sourceVersionId: "version-demo-1",
    sourceSnapshotId: "snapshot-demo-1",
    locatorType: "section",
    locator: "fictional-locator",
    extractedTextStart: 0,
    extractedTextEnd: 1,
    extractionRunId: "extract-demo-1"
  },
  effectivePeriod: {
    effectiveFrom: "2024-01-01",
    effectiveTo: null,
    jurisdictionId: "jur-india",
    status: "verified"
  }
};

const provision: ProvisionRecord = {
  provisionId: "provision-demo",
  logicalProvisionId: "logical-provision-demo",
  provisionKind: "section",
  sourceLabel: "Fictional label",
  text: null,
  citation
};

export function runSafetyTests(): void {
  expect(validateSourceRank(source).ok, "Verified Rank A source should pass source-rank validation.");
  expect(validateSourceStatus(source, "2026-08-29").ok, "Fresh verified source should pass current-law eligibility.");
  expect(validateCitationCompleteness(citation, "2026-08-29").ok, "Complete source span citation should pass validation.");
  expect(retrieveSourceGroundedProvisions([provision], "2026-08-29").provisions.length === 1, "Grounded provision should be retrievable.");

  const rankB: SourceRecord = { ...source, authorityRank: "B" };
  expect(!validateSourceRank(rankB).ok, "Rank B source must not become a published legal source.");

  const unverified: SourceRecord = { ...source, sourceStatus: "in_review" };
  const unverifiedProvision: ProvisionRecord = { ...provision, provisionId: "provision-unverified", citation: { ...citation, source: unverified } };
  const retrieval = retrieveSourceGroundedProvisions([unverifiedProvision], "2026-08-29");
  expect(retrieval.provisions.length === 0 && retrieval.excludedProvisionIds[0] === "provision-unverified", "Unverified material must be excluded from retrieval.");

  const missingLocator: Citation = { ...citation, span: { ...citation.span, locator: "" } };
  expect(!validateCitationCompleteness(missingLocator, "2026-08-29").ok, "Document-level citations without a locator must fail.");

  expect(!validateJurisdiction(null).ok, "Unknown jurisdiction must fail validation.");
  expect(!validateEffectivePeriod({ ...citation.effectivePeriod, effectiveFrom: "2024-99-99" }).ok, "Invalid effective date must fail validation.");
  expect(!validateMatterSeparation({ recordId: "analysis", kind: "analysis", content: "No legal content", sourceRecordId: null, uncertaintyReason: null }).ok, "Analysis without separately identified source inputs must fail.");
  expect(!validateMatterSeparation({ recordId: "uncertainty", kind: "uncertainty", content: "Unknown", sourceRecordId: null, uncertaintyReason: null }).ok, "Uncertainty must include a reason.");

  const initialVersion: DocumentVersion = { versionId: "version-demo-1", sourceId: "source-demo", predecessorVersionId: null, effectiveFrom: "2024-01-01", effectiveTo: null };
  const successor = createSuccessorVersion(initialVersion, { versionId: "version-demo-2", sourceId: "source-demo", effectiveFrom: "2025-01-01", effectiveTo: null });
  expect(successor.predecessorVersionId === initialVersion.versionId, "Successor versions must preserve predecessor lineage.");
  expect(initialVersion.predecessorVersionId === null, "Historical versions must not be overwritten.");
}

runSafetyTests();
