export interface DocumentSnapshot {
  readonly snapshotId: string;
  readonly sourceId: string;
  readonly versionId: string;
  readonly sha256: string;
  readonly acquiredAt: string;
  readonly storageReference: string;
  readonly extractionMethod: "native_text" | "structured_data" | "ocr" | "manual_transcription";
}

/** Snapshot metadata is immutable. Hashing and storage are future infrastructure adapters. */
export function registerSnapshot(snapshot: DocumentSnapshot): Readonly<DocumentSnapshot> {
  return Object.freeze({ ...snapshot });
}
