import assert from "node:assert/strict";
import { buildLegalAnswer } from "../src/answers/answer-builder.js";
import type { ProvisionRecord } from "../src/shared/types.js";

const provision: ProvisionRecord = {
  provisionId: "provision-1",
  logicalProvisionId: "logical-1",
  provisionKind: "section",
  sourceLabel: "Test Official Legal Source",
  text: "यह परीक्षण हेतु सत्यापित कानूनी प्रावधान है।",
  citation: {
    source: {
      sourceId: "source-1",
      title: "Test Official Legal Source",
      authorityRank: "A",
      sourceStatus: "verified",
      verificationStatus: "verified",
      sourceRole: "published_legal_source",
      officialUrl: "https://example.gov.in",
      jurisdiction: {
        id: "IN",
        kind: "country",
        name: "India",
        parentId: null,
      },
      sourceVersionId: "version-1",
      sourceSnapshotId: "snapshot-1",
      nextReviewDueAt: null,
    },
    span: {
      sourceId: "source-1",
      sourceVersionId: "version-1",
      sourceSnapshotId: "snapshot-1",
      locatorType: "section",
      locator: "Section 1",
      extractedTextStart: 0,
      extractedTextEnd: 50,
      extractionRunId: "run-1",
    },
    effectivePeriod: {
      effectiveFrom: "2024-07-01",
      effectiveTo: null,
      jurisdictionId: "IN",
      status: "verified",
    },
  },
};

const answer = buildLegalAnswer(
  provision,
  "कानूनी प्रावधान",
  "यह परीक्षण हेतु नागरिक को दिया जाने वाला उत्तर है।",
);

assert.equal(answer.provisionId, "provision-1");
assert.equal(answer.title, "कानूनी प्रावधान");
assert.equal(
  answer.answer,
  "यह परीक्षण हेतु नागरिक को दिया जाने वाला उत्तर है।",
);

assert.equal(answer.citation.sourceId, "source-1");
assert.equal(answer.citation.sourceVersionId, "version-1");
assert.equal(answer.citation.sourceSnapshotId, "snapshot-1");
assert.equal(answer.citation.locatorType, "section");
assert.equal(answer.citation.locator, "Section 1");

assert.equal(Object.isFrozen(answer), true);
assert.equal(Object.isFrozen(answer.citation), true);

assert.throws(
  () =>
    buildLegalAnswer(
      provision,
      "",
      "उत्तर",
    ),
  /Answer title cannot be empty/,
);

assert.throws(
  () =>
    buildLegalAnswer(
      provision,
      "शीर्षक",
      "",
    ),
  /Answer text cannot be empty/,
);

const provisionWithoutText: ProvisionRecord = {
  ...provision,
  text: null,
};

assert.throws(
  () =>
    buildLegalAnswer(
      provisionWithoutText,
      "शीर्षक",
      "उत्तर",
    ),
  /without verified text/,
);

const provisionWithoutLocator: ProvisionRecord = {
  ...provision,
  citation: {
    ...provision.citation,
    span: {
      ...provision.citation.span,
      locator: "",
    },
  },
};

assert.throws(
  () =>
    buildLegalAnswer(
      provisionWithoutLocator,
      "शीर्षक",
      "उत्तर",
    ),
  /exact citation locator/,
);

console.log("answer-builder tests passed");
