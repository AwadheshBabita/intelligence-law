import type { ProvisionRecord } from "../shared/types.js";
import { validateCitationCompleteness } from "../verification/validators.js";

export interface RetrievalResult {
  readonly provisions: readonly ProvisionRecord[];
  readonly excludedProvisionIds: readonly string[];
}

/**
 * This boundary returns only records with complete verified citations. It performs no
 * semantic generation, text completion, legal inference, or AI integration.
 */
export function retrieveSourceGroundedProvisions(records: readonly ProvisionRecord[], asOfDate: string): RetrievalResult {
  const provisions: ProvisionRecord[] = [];
  const excludedProvisionIds: string[] = [];
  for (const record of records) {
    const validation = validateCitationCompleteness(record.citation, asOfDate);
    if (validation.ok) provisions.push(record);
    else excludedProvisionIds.push(record.provisionId);
  }
  return Object.freeze({ provisions: Object.freeze(provisions), excludedProvisionIds: Object.freeze(excludedProvisionIds) });
}
