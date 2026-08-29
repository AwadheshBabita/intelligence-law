# Intelligence Law Legal Knowledge Base Specification

## 1. Purpose and Scope

This specification defines a source-first, versioned legal knowledge base for representing Indian legal materials in Intelligence Law. It is a technical architecture document, not legal advice and not a source of law.

No legal provision, classification, procedural requirement, or interpretation may be treated as real in the system until it has been verified against an authoritative source and recorded with traceable source metadata.

The knowledge base must support web and mobile product features while keeping legal content, user matter data, application logic, and AI behavior separate.

## 2. Design Principles

- **Authoritative and traceable:** Every displayed legal proposition must resolve to one or more recorded sources.
- **Versioned and non-destructive:** Never overwrite legal text, amendments, or historical states.
- **Structured before generated:** Store legal materials as structured data; AI may explain retrieved material but is never the legal source of truth.
- **Jurisdiction-aware:** All materials are scoped to a jurisdiction and, where relevant, a territorial or court jurisdiction.
- **Neutral and explicit about uncertainty:** Preserve the difference between allegations, reported facts, evidence, legal content, analysis, and unknowns.
- **Modular:** Permit gradual implementation using PostgreSQL, without requiring paid services or an AI provider.

## 3. Core Content Model

### 3.1 Legal instruments, legislative scope, and delegated legislation

A **legal instrument** is a top-level authoritative material, such as the Constitution, a constitutional amendment, Central Act, State Act, Union Territory law, rule, regulation, order, scheme, notification, circular, bye-law, or other official instrument. An instrument has one or more immutable **instrument versions**.

Each instrument must record its legal category, stable official identifier, short and long title where supplied by the source, Act/rule/notification number and year where applicable, issuing authority, official publication/Gazette reference, source language, and territorial applicability.

Territorial applicability is modeled explicitly through jurisdiction links. An instrument may apply nationally, to named States, one or more Union Territories, a defined local area, or a source-defined combination. The system must not infer that a Central Act, State Act, or delegated instrument applies to a territory without verified source support.

Delegated legislation must identify its relationship to its parent/enabling instrument. A rule, regulation, order, scheme, circular, notification, or bye-law may have one or more `made_under`, `issued_under`, `commences`, `modifies_applicability_of`, or other source-backed links to enabling provisions or instruments. This relationship is distinct from a cross-reference.

### 3.2 Provision hierarchy and versioned text

A **provision** is a node within an instrument version. A provision may represent a constitutional provision, chapter, section, sub-section, clause, sub-clause, definition, schedule, explanation, proviso, or another source-defined unit. Provision hierarchy is expressed by a parent provision relationship, not hard-coded depth limits.

Each provision record should contain:

- Stable internal identifier and source-facing label/number.
- Provision type and parent provision, where applicable.
- Exact verified text (or an explicit indication that text is unavailable).
- Instrument version and jurisdiction.
- Effective start and end dates where known.
- Verification status, verifier, and last-verified date.
- Official source URL/reference and an optional archival reference.
- Structural ordering fields for preserving the source order.

This hierarchy supports Constitution → provision, Act → chapter → section → sub-section → clause → sub-clause, as well as instruments whose drafting structure differs.

### 3.3 Legal concepts attached to provisions

Structured annotations are attached to a provision rather than embedded as untraceable prose. An annotation has a type, source citation, review status, effective period, and confidence/uncertainty statement.

Supported annotation types include:

- `definition`
- `offence_element`
- `general_exception`
- `applicable_exception`
- `punishment`
- `procedural_requirement`
- `bail_information`
- `offence_classification` (including cognizable/non-cognizable only when verified and applicable)
- `arrest_procedure_relationship`
- `evidence_relevance`
- `related_provision`
- `cross_reference`
- `interpretive_note`

Annotations must not be created from model output alone. They must point to an authoritative legal text, a verified official classification, or a reviewed judicial source.

### 3.4 Relationships

Legal relationships are stored explicitly so that the UI and analysis engine can explain why materials are connected. A relationship must state its type, source, scope, and effective dates.

Examples of relationship types:

- provision defines a term used by another provision;
- provision creates, modifies, qualifies, or repeals another provision;
- provision sets a procedural requirement for an arrest-related event;
- provision contains or refers to a general exception;
- provision is related to evidence handling or relevance;
- one instrument cross-references a provision in another instrument;
- a judgment interprets, applies, distinguishes, limits, or discusses a provision;
- a notification changes applicability, commencement, or administrative treatment.

### 3.5 Durable provision identity and lineage

The source-facing provision number is not a durable identity: a provision may be renumbered, substituted, split, merged, omitted, restored, or moved. The data model must therefore distinguish:

- a **logical provision**: a stable internal identity used to track lineage through time; and
- a **versioned provision**: the exact text, label, hierarchy, and effective period in one instrument version.

Lineage records connect versioned provisions with explicit operations: `continues_as`, `renumbered_to`, `substituted_by`, `split_into`, `merged_into`, `omitted_by`, `repealed_by`, `restored_by`, `moved_to`, or `corrected_by`. Every lineage operation must cite the verified amendment or official source that establishes it. A missing lineage link is an uncertainty, not permission to assume equivalence.

## 4. Source, Verification, and Citation Model

### 4.1 Source records

Every imported item has a `source_record` that captures:

- Source type: official legislation portal, Gazette, constitutional publication, court repository, official notification source, or another approved source category.
- Publisher/issuing authority.
- Official document identifier and official URL or official publication reference. Gazette material must retain available series, part, section, issue/date, page, and entry locators.
- Retrieval date, document date, checksum or file hash, immutable source snapshot/reference, extraction method, and archival reference. A snapshot must identify the exact source content relied on even if the source URL later changes.
- Jurisdiction, language, source availability status, and source-language metadata.
- Verification status: `draft`, `unverified`, `in_review`, `verified`, `superseded`, `disputed`, or `withdrawn`.
- Authority ranking, such as official primary publication, official court repository, certified/court-issued copy, or approved secondary reference. Primary official sources take precedence for legal text.
- Last verified date, verification method, reviewer identity or role, and link to verification evidence.

Verification is a workflow rather than a single flag. A material moves through `draft`, `in_review`, `verified`, `superseded`, `disputed`, or `withdrawn` status. Each transition is append-only and records the reviewer, time, review scope, source snapshot, evidence checked, decision, and reason. Only verified materials may support displayed statements of law.

### 4.2 Citation records

A citation is a precise link from a legal assertion to a source. It must record the cited provision/judgment/notification, pinpoint locator (section, clause, page, paragraph, Gazette entry, or equivalent), instrument version, source record, and source snapshot. It may retain a short retrieved excerpt where permitted.

No answer may present a legal proposition as verified unless it includes at least one resolvable, verified citation. If an authoritative source cannot be retrieved or verified, the output must say so rather than fill the gap.

## 5. Versions, Amendments, and Historical Law

### 5.1 Immutable versions

An instrument version is immutable after publication. It represents the text and structure known to be effective during a defined time period. A correction is represented by a new version or a documented verification correction, never by silently changing a historical record. Historical source text, source snapshots, verification decisions, and prior version relationships must remain queryable.

### 5.2 Amendments

An amendment is a separate event linked to:

- the amending instrument or official notification;
- the affected instrument and prior version;
- affected provisions;
- operation type, such as insertion, substitution, omission, repeal, commencement, or correction;
- enactment, assent, publication, commencement, and effective dates where available;
- any source-verified partial commencement, territorial scope, provision scope, or retrospective/prospective operation;
- verified citations and source record.

Applying an amendment creates or identifies a successor instrument version. Earlier versions and their provisions remain queryable for matters whose relevant event dates precede the change.

### 5.3 Temporal queries

Every legal query accepts an `as_of_date`, jurisdiction, and, when relevant, event location. The retrieval layer selects the verified version effective for that scope and separately identifies whether it is current. If dates are missing, overlapping, disputed, or only partially commenced, it must return a clear uncertainty indicator rather than assume a version. No historical text may be overwritten to make it appear current.

## 6. Judgments and Government Notifications

### 6.1 Judgments

Store judgments as independent legal materials with court, court level, territorial/court jurisdiction, bench metadata where available, decision date, case/appeal identifiers where available, neutral/official citation, official source URL/reference, source language, verification status, and full or permitted text reference. Court hierarchy must be represented explicitly so that a decision is never presented without its issuing court and jurisdictional context.

Use a join model to connect a judgment to provisions and record the relationship type: `interprets`, `applies`, `distinguishes`, `limits`, `overrules_or_supersedes`, `discusses`, or `procedural_context`. A separate judgment-to-judgment relationship may record verified later treatment. Judicial treatment must always be represented as a source-backed, scoped relationship; it is not a free-form statement of current law or an automated statement of precedent.

### 6.2 Notifications

Store government notifications as legal materials with issuer, publication date, reference number, official source, affected jurisdiction, effective period, and relationships to affected instruments/provisions. Notifications may establish commencement, modify applicability, or provide another legally relevant effect only after verification.

## 7. Matter Information and Truth-Status Separation

User matter information is separate from the legal knowledge base. It must use explicit categories and never be silently converted from one category into another. A claim, evidence item, verified fact, or analysis output does not establish guilt, innocence, admissibility, reliability, or a legal outcome.

| Category | Meaning | Permitted representation |
|---|---|---|
| Allegation | A claim that attributes conduct, responsibility, or an event to a person or party; not established merely because it is entered | `allegation` with author, subject, time, and status |
| Claim | Any attributed assertion made by a person or party; it may support, deny, contextualize, or dispute an allegation | `claim` with author, time, and status |
| User-provided fact | Information supplied by a user; may be incomplete or unverified | `reported_fact` with source=user |
| Verified evidence | An evidence item for which defined attributes, such as provenance or integrity, have been checked under a documented process | `evidence_item` plus scoped verification record |
| Verified fact | A fact supported by explicit verification criteria and linked evidence/source; this does not itself decide a legal issue | `verified_fact` with basis and reviewer |
| Legal provision | A source-backed item from the curated legal knowledge base | `provision` plus verified citation |
| Legal analysis | A conditional application of retrieved legal material to stated inputs | `analysis_output` with inputs and citations |
| Uncertainty | Missing, disputed, conflicting, unverified, or date/jurisdiction-dependent information | `uncertainty` with reason and next verification step |

Claims and facts must retain author/source, assertion time, event time where known, and links to supporting, contradicting, or disputed material. Evidence must retain provenance, collection/upload metadata, hashes where appropriate, chain-of-custody events where recorded, access controls, redaction status, and a scoped verification status. The system must not label an item as authentic, admissible, proven, reliable, or sufficient unless a verified, appropriately scoped basis has been recorded.

## 8. AI Retrieval and Answer Controls

### 8.1 Retrieval workflow

1. Identify the user-selected or inferred jurisdiction and ask for clarification when it cannot be established safely.
2. Identify the relevant date or date range.
3. Retrieve only approved, verified legal materials effective for that time period.
4. Retrieve structured relationships, annotations, judgments, and notifications that are source-linked and applicable to the query.
5. Construct a bounded evidence packet containing only the exact source text or permitted excerpts, source spans, source snapshot, legal version, effective dates, jurisdiction, authority ranking, and immutable citation identifiers used for the answer.
6. Provide only that bounded packet to the AI gateway for legal explanation. The model must not use unstated legal knowledge as a source.
7. Require output to use a structured schema: legal proposition, source-span citation IDs, applicability conditions, user-input references, uncertainty, and possible lawful next steps.
8. Deterministically validate every cited provision identity, version, jurisdiction, effective date, source snapshot, verification status, and source span against the retrieval set before displaying the answer.

### 8.2 Hallucination prevention

- The AI has no authority to create legal provisions, section numbers, case names, quotations, classifications, or citations.
- The AI may cite only IDs supplied by retrieval; any other citation is rejected.
- A legal claim without a verified retrieved source span is blocked; it must not be displayed as law, even with an "unverified" label.
- Citation validation checks jurisdiction, provision existence, lineage/version identity, effective date, source snapshot, source span, authority ranking, and source verification status.
- The answer generator must state uncertainty when sources conflict, are incomplete, are not current, or do not establish applicability.
- System prompts and output schemas must prohibit final conclusions on guilt, innocence, admissibility, or legal outcome.
- The system logs the retrieval packet identifiers, validation result, model/provider and prompt-policy version, and displayed answer for audit, without unnecessarily retaining sensitive user matter content.

AI-generated analysis is informational and conditional. It must clearly separate source text, user-provided inputs, analysis, and unresolved questions.

## 9. Conflicts and Uncertainty

Conflicting or unclear materials are represented, not hidden. The system should:

- preserve each source and its authority level;
- identify the conflict type, such as version conflict, source conflict, interpretation conflict, or incomplete effective-date data;
- avoid selecting a winner unless a verified, documented legal basis supports that choice;
- present the conflict and scope in plain language;
- direct the user to verified next steps or professional legal assistance when material uncertainty remains.

The system must not infer a jurisdiction, effective date, classification, or legal consequence merely because a similar provision exists.

## 10. Language and Translation Management

Legal source text must retain its source language and script. A translation is a separate derived record linked to the exact source snapshot, version, provision, translator/translation method, creation date, review status, and scope. The original verified source text remains authoritative unless an official translation is itself recorded and verified.

The system must label non-official or machine-assisted translations as informational and must not use them as the only basis for a legal assertion when the original source or an official translation is unavailable. Search indexes may include normalized transliteration and approved translations, but retrieval responses must identify the language of the cited source.

## 11. Privacy, Security, and Sensitive Matter Data

Public legal knowledge and private user matter data must be separated by authorization boundaries. Before real matter data is collected, the system must implement:

- encryption in transit and encryption at rest for sensitive data and document storage;
- role-based and matter-level access control, least-privilege defaults, and short-lived document access links;
- append-only audit logs for sensitive reads, writes, exports, verification actions, and access-policy changes;
- data minimization, purpose limitation, explicit consent or another documented lawful basis, and redaction controls;
- documented retention, deletion, export, and anonymization policies;
- secure upload, malware scanning, private storage, integrity hashing, and controlled download handling for documents;
- controls preventing private matter data from entering routine logs, analytics, or AI prompts unless expressly required, authorized, and minimized.

No user-provided material may be used for model training without explicit, informed opt-in and a documented privacy review.

## 12. PostgreSQL-Compatible Data Model

The initial implementation can use PostgreSQL with conventional relational tables and full-text search. Vector search, external search services, and generative AI are optional later additions, not MVP requirements.

Suggested tables:

| Table | Purpose | Key relationships |
|---|---|---|
| `jurisdictions` | India and nested territorial/court jurisdictions | parent jurisdiction self-reference |
| `courts` | Court hierarchy, level, territorial jurisdiction, and official identity | parent court; jurisdiction reference |
| `source_publishers` | Official publishers and issuing authorities | referenced by sources |
| `source_records` | Official identifiers, URLs, Gazette locators, authority rank, and retrieval metadata | belongs to publisher and jurisdiction |
| `source_snapshots` | Immutable content/hash and extraction record for a retrieved source | belongs to source record |
| `legal_instruments` | Stable identity for Constitution, Central/State/UT Acts, and delegated legislation | has many versions; territorial scope |
| `instrument_jurisdictions` | Source-backed territorial applicability | joins instruments/versions to jurisdictions |
| `instrument_authorities` | Enabling or issuing relationship for delegated legislation | links instrument/provision to parent authority |
| `instrument_versions` | Immutable historical/current versions | belongs to instrument; source-backed |
| `logical_provisions` | Durable identity across renumbering and amendment | has many versioned provisions |
| `provisions` | Hierarchical, version-specific provision nodes | belongs to version and logical provision; parent provision self-reference |
| `provision_lineage` | Non-destructive continuity, split, merge, omission, and restoration links | joins versioned provisions; cited |
| `provision_annotations` | Definitions, elements, punishments, procedures, classifications, and notes | belongs to provision; cited |
| `legal_relationships` | Provision-to-provision and cross-instrument links | source and target legal nodes |
| `amendment_events` | Insertions, substitutions, repeals, commencements, and corrections | links versions and provisions |
| `judgments` | Court decision metadata and source references | source-backed |
| `judgment_provision_links` | Judicial relationship to provisions | joins judgments and provisions; cited |
| `judgment_treatment_links` | Verified subsequent judicial treatment | joins judgments; cited |
| `notifications` | Government notification metadata | source-backed; may link instruments/provisions |
| `notification_effects` | Scoped effect of a notification | joins notifications to legal nodes |
| `citations` | Pinpoint source/span references for any legal assertion | references source snapshot and legal node |
| `verification_records` | Append-only review, evidence, decision, and status history | typed target references |
| `translations` | Source-language, official or derived translations | links source snapshot/version/provision |
| `claims` | Attributed allegations or assertions in a user matter | belongs to matter |
| `reported_facts` | User-provided facts | may link to claims/evidence |
| `evidence_items` | Private evidence metadata and provenance | belongs to matter; controlled access |
| `evidence_verifications` | Evidence verification history | belongs to evidence item |
| `verified_facts` | Facts supported by explicit basis and review criteria | links reported facts/evidence |
| `analysis_outputs` | Source-bound, conditional analysis | links inputs and citations |
| `uncertainties` | Explicit unresolved/conflicting data | links to a matter, analysis, or legal node |

Use UUID primary keys, timestamps, `effective_from`/`effective_to` fields, JSONB only for genuinely variable metadata, and normalized join tables for legal relationships. Keep private matter tables in a separately permissioned schema or service boundary from public legal content.

Database integrity rules must include:

- uniqueness for official instrument identifiers within the issuing authority and jurisdictional scope, and unique source snapshot hashes within a source record;
- unique source-facing provision labels within one instrument version and parent scope, while allowing the same label in different historical versions;
- foreign keys for citations, lineage, amendment events, relationships, translations, and verification records;
- checks that an effective end is not before an effective start;
- exclusion or equivalent constraints preventing overlapping verified effective ranges for the same instrument/version/jurisdiction scope, unless explicitly marked as disputed;
- append-only source snapshot, verification, amendment, and audit history;
- indexes for jurisdiction, instrument type/identifier, parent provision, effective dates, verification status, official citation, source hash, and full-text legal text.

## 13. Fictional Sample Data

The following is entirely fictional. Names, numbers, content, and URLs are placeholders and must not be interpreted as Indian law.

```text
Jurisdiction:
  id: jur-demo
  name: "Example Territory"

Legal instrument:
  id: instrument-demo
  title: "Sample Public Safety Act"
  instrument_type: "act"
  jurisdiction_id: jur-demo

Instrument version:
  id: version-demo-2025
  instrument_id: instrument-demo
  effective_from: 2025-01-01
  verification_status: verified
  source_record: source-demo

Provision hierarchy:
  Chapter "Illustrative Chapter"
    Section "Sample Section A"
      Sub-section "(1)"
        Clause "(a)"

Annotation:
  provision: "Sample Section A"
  type: procedural_requirement
  text: "Fictional procedural summary for schema demonstration only."
  citation: citation-demo

Source record:
  id: source-demo
  official_url: "https://example.invalid/official-source"
  status: verified
  last_verified_date: 2026-01-01

Amendment event:
  id: amendment-demo
  operation: substitution
  affected_provision: "Sample Section A"
  successor_version: version-demo-2026
  effective_from: 2026-01-01

Matter data:
  claim: "A participant alleges a fictional event occurred."
  reported_fact: "A user reports a date, not yet verified."
  evidence_item: "A fictional document with unverified provenance."
  analysis_output: "Possible relevance is conditional and source-cited; no conclusion is made."
  uncertainty: "Authenticity and applicable version have not been established."
```

## 14. MVP and Later-Phase Requirements

### MVP requirements

For the zero-cost MVP, begin with a small manually curated set of authoritative source records, immutable source snapshots, reviewer status, verified citations, versioned instruments/provisions, plain PostgreSQL full-text search, and citation-first display. Implement the core claim/fact/evidence/analysis/uncertainty separation and do not expose private matter storage until the required security controls are in place. Do not introduce paid APIs, subscriptions, or unnecessary dependencies without explicit approval. Do not populate this structure with actual legal content until the authoritative-source ingestion and verification workflow is in place.

### Later-phase requirements

Automated source-ingestion and change monitoring, OCR for scanned sources, complex judgment-treatment graphs, multilingual alignment at scale, vector/semantic search, AI-provider integrations, professional reviewer workspaces, advanced evidence chain-of-custody features, and native mobile document-capture features may be added later. Each requires separate privacy, source-quality, operational-cost, and legal-safety review before implementation.
