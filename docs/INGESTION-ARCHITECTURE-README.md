# Legal Source Ingestion Foundation

This TypeScript foundation implements no UI, database connection, network acquisition, AI integration, or legal text corpus. It provides deterministic domain types and validation boundaries for future manual ingestion of official legal documents.

## Layout

- `src/sources/`: source registry eligibility and future fetcher interface.
- `src/documents/`: immutable snapshot metadata and non-destructive document-version lineage.
- `src/provisions/`: extraction-candidate boundary; candidates do not become legal content automatically.
- `src/verification/`: deterministic checks for Rank A, source status, citation completeness, jurisdiction, effective dates, and matter-category separation.
- `src/retrieval/`: source-grounded filtering only; no model, semantic inference, or generated legal content.
- `src/shared/`: strict domain types and reusable date/validation helpers.
- `tests/`: dependency-free safety-rule tests.

## Safety model

Only verified, current-eligible Rank A sources with a version, snapshot, jurisdiction, verified effective period, and exact source span can be retrieved as current-law records. Unknown fields remain null and exclude a record from publication. Historical versions are preserved by adding successor versions rather than overwriting prior objects.

The source registry dataset remains in review and cannot pass the publication validators until a future manual source-verification workflow creates the required snapshot, version, source-span, review, and currentness records.

## Validation

The project uses `tsconfig.json` with strict checks and intentionally declares no package dependencies. When a local Node.js and TypeScript compiler are available, run:

```text
tsc --noEmit
```

The test file is dependency-free TypeScript and is designed to be executed by a future approved test runner after the local TypeScript toolchain is available.
