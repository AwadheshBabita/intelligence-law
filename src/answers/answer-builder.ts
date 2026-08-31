import type { ProvisionRecord } from "../shared/types.js";

export interface LegalAnswer {
  readonly provisionId: string;
  readonly title: string;
  readonly answer: string;
  readonly citation: {
    readonly sourceId: string;
    readonly sourceVersionId: string;
    readonly sourceSnapshotId: string;
    readonly locatorType: string;
    readonly locator: string;
  };
}

/**
 * Builds a deterministic citizen-facing answer from a verified provision.
 *
 * This function:
 * - does not call Gemini or any AI model
 * - does not search the internet
 * - does not invent legal provisions
 * - preserves the exact source citation
 */
export function buildLegalAnswer(
  provision: ProvisionRecord,
  title: string,
  answer: string,
): Readonly<LegalAnswer> {
  if (title.trim() === "") {
    throw new Error("Answer title cannot be empty.");
  }

  if (answer.trim() === "") {
    throw new Error("Answer text cannot be empty.");
  }

  if (provision.text === null || provision.text.trim() === "") {
    throw new Error("Cannot build an answer from a provision without verified text.");
  }

  if (provision.citation.span.locator.trim() === "") {
    throw new Error("Cannot build an answer without an exact citation locator.");
  }

  return Object.freeze({
    provisionId: provision.provisionId,
    title: title.trim(),
    answer: answer.trim(),
    citation: Object.freeze({
      sourceId: provision.citation.span.sourceId,
      sourceVersionId: provision.citation.span.sourceVersionId,
      sourceSnapshotId: provision.citation.span.sourceSnapshotId,
      locatorType: provision.citation.span.locatorType,
      locator: provision.citation.span.locator,
    }),
  });
}
