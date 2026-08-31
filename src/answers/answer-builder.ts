import type { ProvisionRecord } from "../shared/types.js";

export interface LegalAnswer {
  readonly provisionId: string;
  readonly title: string;
  readonly answer: string;
  readonly citation: {
    readonly sourceId: string;
    readonly sourceVersionId: string;
    readonly sourceSnapshotId: string;
    readonly locator: string;
  };
}

/**
 * Builds a deterministic answer from an already verified provision.
 *
 * This function does not invent legal text, perform legal inference,
 * call an AI model, or search external sources.
 */
export function buildLegalAnswer(
  provision: ProvisionRecord,
  answerText: string,
  title: string,
): Readonly<LegalAnswer> {
  if (answerText.trim() === "") {
    throw new Error("Answer text cannot be empty.");
  }

  if (title.trim() === "") {
    throw new Error("Answer title cannot be empty.");
  }

  return Object.freeze({
    provisionId: provision.provisionId,
    title: title.trim(),
    answer: answerText.trim(),
    citation: Object.freeze({
      sourceId: provision.citation.span.sourceId,
      sourceVersionId: provision.citation.span.sourceVersionId,
      sourceSnapshotId: provision.citation.span.sourceSnapshotId,
      locator: provision.citation.span.locator,
    }),
  });
}
