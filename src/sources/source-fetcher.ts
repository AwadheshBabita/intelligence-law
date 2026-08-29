import type { SourceRecord } from "../shared/types.js";

export interface SourceFetchRequest {
  readonly source: SourceRecord;
  readonly requestedAt: string;
}

export interface SourceFetchResult {
  readonly sourceId: string;
  readonly status: "not_fetched" | "acquired" | "failed";
  readonly failureReason: string | null;
}

/**
 * Network acquisition is deliberately not implemented in the foundation.
 * A future adapter must acquire only reviewed Rank A source URLs and create a snapshot.
 */
export interface SourceFetcher {
  fetch(request: SourceFetchRequest): Promise<SourceFetchResult>;
}
