# Intelligence Law Legal Source Registry Specification

## 1. Purpose

This specification defines the Legal Source Registry: the source-of-record layer that identifies, registers, verifies, versions, and monitors legal source documents used by Intelligence Law.

It is a technical architecture document, not legal advice and not a repository of legal conclusions. This document contains no real legal provisions. Any examples are fictional placeholders only.

The registry is the provenance boundary for the legal knowledge base. The AI must never treat an unverified source as authoritative, invent or reconstruct missing legal text, or present a legal provision without a traceable source document and version.

## 2. Registry Principles

- **Primary-source first:** Prefer official publications and official court repositories over all secondary materials.
- **Immutable evidence of retrieval:** Preserve a content hash and source snapshot/reference for each acquired document.
- **Versioned, never overwritten:** A changed, corrected, repealed, superseded, or newly retrieved document becomes a separately recorded version or snapshot.
- **Scope-aware:** Record issuing authority, territorial/court jurisdiction, language, and dates before a source is used.
- **Human-verifiable:** Verification status is supported by reviewer decisions and evidence, not a model assertion.
- **Fail closed:** When an authoritative source, required date, or verified text is missing, the system must state that it cannot verify the material.
- **Zero-cost MVP compatible:** Start with manual registration, review, hashing, and PostgreSQL full-text metadata; defer automated ingestion and paid services.

## 3. Registered Source Categories

The registry supports these categories without assuming that a particular document is genuine or current until verified:

| Source category | Jurisdiction scope to record | Registry purpose and typical issuing/publishing authority |
|---|---|---|
| Constitution of India and constitutional amendment | India; provision-specific scope where verified | Constitutional source document/amendment history; official constitutional or Gazette publisher as verified |
| Central Act | India plus source-defined State, Union Territory, local, or partial-commencement scope | Parliamentary legislation; official legislation/Gazette publisher as verified |
| State Act | Named State plus source-defined local or partial scope | State legislation; relevant State legislature/Gazette publisher as verified |
| Union Territory law | Named Union Territory plus source-defined local or partial scope | Union Territory or centrally issued law; relevant official authority/Gazette publisher as verified |
| Rule or regulation | Scope inherited only when source-backed; otherwise explicitly recorded | Delegated legislation; rule-making or regulatory authority as verified |
| Delegated legislation, scheme, circular, or administrative direction | Issuing authority and source-defined territorial/subject scope | Material issued under a verified enabling authority, where applicable |
| Notification or order | Issuer, territorial scope, affected instrument/provision, and effective scope | Official commencement, applicability, administrative, or other source-defined legal effect |
| Local or municipal bye-law | Named local authority and local territorial scope | Local delegated legislation; local authority and official publication/Gazette source where verified |
| Government publication or Gazette | Publishing jurisdiction and Gazette series/part/section scope | Official publication artifact supporting other legal material |
| Supreme Court judgment | Supreme Court and case-specific jurisdiction | Judicial decision; official court repository/certified official record as verified |
| High Court judgment | Named High Court and territorial/court jurisdiction | Judicial decision; relevant official court repository/certified official record as verified |
| Tribunal decision | Named tribunal, statutory/territorial jurisdiction, and level | Legally relevant adjudicatory decision; issuing body/source as verified |
| Other judicial decision | Named issuing court/body and court/territorial jurisdiction | Subordinate court or other approved judicial decision; issuing body/source as verified |

The category records a document's source nature and required jurisdiction fields; it does not decide legal force, precedential value, applicability, or current status. Authority rank is assigned to the exact source publication/snapshot, not merely to a category or government domain.

## 4. Common Registry Record

Every registered source document/version must retain the following fields. Fields that cannot be established are recorded as unknown with a reason; they are not guessed.

| Field | Requirement |
|---|---|
| `source_id` | Stable internal UUID for the source identity |
| `source_version_id` | Immutable UUID for the registered document/version/snapshot |
| `source_category` | One of the supported source categories or an approved extension |
| `authority_rank` | Rank determined under the authority model in this specification |
| `issuing_authority` | Body that made/issued the material, where known |
| `official_publisher` | Official publisher or court repository, where verified |
| `official_domain` | Verified official host/domain or official publication reference |
| `document_identifier` | Official Act/rule/notification/case/Gazette/document identifier where supplied |
| `instrument_title` | Source title exactly as published, where available |
| `instrument_type` | Constitution, Act, rule, notification, judgment, Gazette, etc. |
| `jurisdiction_scope` | India, State, Union Territory, territorial, court, or source-defined scope |
| `source_language` | Language and script of the acquired source |
| `publication_date` | Official publication/decision date, if verified |
| `effective_date` | Effective/commencement date and scope, if established |
| `status` | Draft, in review, verified, stale, superseded, disputed, withdrawn, revoked, unavailable, or broken-link |
| `amendment_repeal_status` | Current, amended, partially commenced, repealed, historical, unknown, or source-defined verified status |
| `version_identifier` | Official version, Gazette issue, judgment revision, or internal immutable version key |
| `source_url_or_reference` | Official URL and/or publication/Gazette/court reference |
| `snapshot_hash` | Cryptographic hash of acquired source bytes or a documented immutable equivalent |
| `snapshot_location` | Controlled storage/reference to the exact acquired content or permitted archival snapshot |
| `extraction_method` | Native text, verified structured data, OCR, manual transcription, or other recorded method |
| `verification_status` | Current verification state with source-specific reason |
| `reviewer` | Reviewer identity or role responsible for the decision |
| `verification_date` | Date/time of verification decision |
| `last_checked_date` | Most recent source-availability/currentness check |
| `historical_relationship` | Links to earlier/later versions and historical status |
| `replacement_successor` | Verified replacement, successor, repeal, correction, or supersession relationship |

Where one document contains multiple instruments or parts, retain document-level fields in the source record and source-facing locators for each registered material.

### 4.1 Minimum immutable source-span locator

A document-level citation is never sufficient for a published legal assertion. Every published provision, classification, amendment effect, judgment-to-provision relationship, judgment-to-judgment relationship, and AI-supported legal proposition must reference an immutable source span containing at least:

- `source_document_version_id` and `source_snapshot_id`/snapshot hash;
- source locator type and pinpoint value, such as Gazette series/part/entry/page, section/sub-section/clause, or judgment paragraph/page;
- normalized-text start and end offsets when extracted text is available, plus the extraction-run identifier;
- the exact source-language excerpt or a hash/reference to the excerpt when storing it is not permitted;
- the source version, jurisdiction scope, effective/applicability period, and verification review that approved the span.

If an exact source span cannot be established, the material may remain registered for research but is ineligible for publication, knowledge-base annotation, or AI legal retrieval.

### 4.2 Registry source roles

The registry distinguishes four roles for material. A record may have more than one role, but each role must be recorded separately:

| Role | Meaning | MVP publication rule |
|---|---|---|
| Discovery source | A lead used to find, compare, or locate potential primary material | May be any rank; never cited as authority or placed in an AI legal evidence packet |
| Authoritative source | A verified Rank A primary/official source snapshot with jurisdiction, date, and source-span metadata | Eligible to support legal content only after legal review and currentness checks |
| Verification evidence | Material used to document a review decision, such as a comparison record, official notice, hash check, or reviewer note | Supports the verification audit trail; does not itself become legal authority unless independently eligible |
| Published legal source | An authoritative source span that is verified, current-eligible, approved for publication, and linked to a knowledge-base record | May be cited in a published legal proposition or MVP AI evidence packet |

## 5. Source-Type Metadata

### 5.1 Constitution, Acts, and Union Territory laws

For constitutional materials, Central Acts, State Acts, and Union Territory laws, additionally record the official number/year where supplied, short and long title, enactment/assent/publication/commencement dates, territorial applicability, parent constitutional or legislative relationship where applicable, and source-verified amendment/repeal history.

State and Union Territory material must identify the State or Union Territory explicitly. Central material must not be assumed to apply identically everywhere; source-backed territorial exceptions, partial commencement, and local modifications must be represented when known.

### 5.2 Rules, regulations, notifications, orders, and Gazette publications

Delegated and administrative materials must record the enabling Act/instrument and enabling provision where verified, issuing department/authority, publication/Gazette identifier, series/part/section/page/entry locator where available, date of issue, date of publication, and legal-effect scope. A notification or order may commence, alter applicability, amend, or otherwise affect material only through a cited and verified relationship.

### 5.3 Amendment-document to provision-effect linkage

An amendment must be recorded through a distinct, source-backed `amendment_effect` record. A document-level relationship alone is insufficient. Each effect record must identify:

- the **source document version/snapshot** that contains the amendment text;
- the **amendment instrument** or official notification/order and its identifier;
- the affected legal instrument and the affected **prior versioned provision** (or an explicit source-backed statement that the effect is instrument-wide);
- operation type: insertion, substitution, renumbering, split, merge, omission, repeal, restoration, correction, commencement, or another approved source-defined operation;
- the successor legal instrument version and successor versioned provision(s), including logical-provision lineage links where applicable;
- provision-specific effective date, territorial scope, partial-commencement scope, and retrospective/prospective scope where verified; and
- the exact immutable source span and verification review establishing the effect.

An amendment effect with an unidentified affected or successor provision must be marked `incomplete_lineage`. It cannot be published as a complete provision history or used to claim that a particular provision is current. The knowledge base may display the unresolved amendment only with explicit uncertainty.

### 5.4 Judicial decisions

Judgment records must include court identity, court level, court hierarchy parent, territorial/court jurisdiction, bench metadata where available, decision date, case/appeal identifier, neutral/official citation where available, source document locator, source language, and status.

Judgment-to-provision and judgment-to-judgment treatment links must be separately registered with source pinpoints and review status. The registry does not automatically determine binding effect, ratio, precedent, or whether a judgment is overruled.

## 6. Authority-Ranking Model

Authority rank controls source preference during discovery and retrieval. It does not convert a source into law or resolve every legal conflict.

| Rank | Source class | Retrieval rule |
|---|---|---|
| A | Official primary publication: official Gazette, official legislation publication, official Constitution publication, official court repository/certified official record | Preferred source for text and legal assertions |
| B | Another verifiable government or court publication that reproduces the official material with a traceable reference | Discovery/corroboration only in the MVP; any later legal-proposition use requires the explicit exception policy below |
| C | Approved institutional mirror or archival copy with documented provenance | Discovery/corroboration only unless an approved policy permits limited use |
| D | Reputable secondary material | Discovery/context only; never the sole authority for published legal text or legal propositions |
| E | Unverified, user-supplied, AI-generated, or unknown-origin material | Never authoritative; may be recorded as a lead with restricted status |

### 6.1 MVP source eligibility

For the MVP, only a **verified Rank A source snapshot** may support a published legal provision, legal classification, judgment relationship, amendment effect, or AI-supported legal proposition. The source must also have a known jurisdiction, applicable effective-date scope, exact source span, and current eligible status under Section 7.5.

Ranks B through E are ineligible to support a published statement of law in the MVP. They may be stored only as restricted discovery, comparison, or corroboration records and must not enter an AI evidence packet as legal authority.

### 6.2 Exceptional lower-rank use after the MVP

Any later exception for Rank B material requires a separately approved written policy, a documented reason that the Rank A source is unavailable, documented provenance to the official material, named reviewer approval, a scope/date/jurisdiction limit, and clear user-facing disclosure. It must never silently replace a Rank A source. Ranks C, D, and E remain ineligible as the sole support for published legal text or an AI legal proposition.

### 6.3 MVP source-use decision table

| Source rank | Allowed MVP use | Citation eligibility | Current-law eligibility |
|---|---|---|---|
| A, verified and current-eligible | Registration, verification, publication, knowledge-base linkage, and bounded AI evidence packets | Eligible only through an exact approved source span | Eligible when jurisdiction, effective date, and review freshness are valid |
| A, but stale/disputed/superseded/withdrawn/revoked/unavailable/broken-link | Historical research and source recovery only | Historical citation only when status and `as_of_date` are disclosed; not a current-law citation | Not eligible until re-verified or replaced by an eligible successor |
| B | Discovery, cross-checking, and research assistance | Not eligible for published legal propositions in the MVP | Not eligible |
| C or D | Discovery, context, and research assistance only | Not eligible for published legal propositions | Not eligible |
| E | Restricted lead only; do not rely on it for legal research without separate review | Not eligible | Not eligible |

If no verified, current-eligible Rank A source is available, the system must state that the information is unverified or unavailable and must not present it as authoritative current law.

## 7. Verification and Lifecycle Rules

### 7.1 Discovery through publication

The future ingestion workflow is:

```text
discover → acquire → hash → extract → validate → review → publish → monitor
```

1. **Discover:** Register a candidate URL/reference and source category without treating it as authoritative.
2. **Acquire:** Obtain source content through a permitted method and record acquisition time and location.
3. **Hash:** Calculate and store a cryptographic hash and immutable snapshot/reference.
4. **Extract:** Produce normalized text/metadata while retaining original bytes and extraction method.
5. **Validate:** Check identifier, issuing authority, domain/reference, document completeness, language, dates, and basic structure.
6. **Review:** A designated reviewer compares the extracted material with the source snapshot and records evidence, scope, decision, and unresolved issues.
7. **Publish:** Expose only verified source content and verified relationships to the legal knowledge base.
8. **Monitor:** Re-check source availability, hashes, notices of amendment/repeal, and successor documents on a defined schedule or trigger.

### 7.2 Manual verification

Manual review is mandatory for all MVP material before publication. Reviewer records must state what was checked, which snapshot was used, whether text/extraction was compared, the decision, decision date, reviewer identity/role, and any limitations. Verification is append-only; later reviewers add a new record instead of replacing earlier decisions.

The MVP uses three practical roles:

- **Source curator:** registers candidates, records acquisition details, hashes/snapshots, extraction metadata, source category, and suspected authority rank. A curator may prepare but does not independently publish legal material.
- **Legal reviewer:** checks that a Rank A source, exact source span, jurisdiction, effective scope, and extraction support the proposed legal record; approves, rejects, or marks it incomplete/disputed. A legal reviewer approves publication eligibility.
- **Administrator:** manages access roles, source-category/interval policy, audit retention, and status recovery/escalation. The administrator does not bypass source-span or Rank A requirements.

For a small MVP team, one person may hold more than one role, but each action must record the role used. Where the same person both curates and reviews a record, the record must state that fact and an administrator must review any later dispute, withdrawal, or material correction. No large multi-reviewer workflow is required for ordinary MVP records.

### 7.3 MVP re-verification intervals

The initial corpus is manually re-verified according to the following maximum intervals, measured from the last successful currentness check:

| Source category | Maximum MVP interval | Manual check focus |
|---|---:|---|
| Constitution, constitutional amendments, Central Acts, State Acts, and Union Territory laws | 90 days | Official version, amendment/repeal, commencement, territorial scope |
| Rules, regulations, delegated legislation, local/municipal bye-laws | 90 days | Enabling authority, amendment/repeal, territorial applicability |
| Notifications, orders, and Gazette publications | 30 days | Official publication, effective/commencement date, replacement or withdrawal |
| Supreme Court, High Court, tribunal, and other judicial decisions | 90 days | Official availability, correction, later treatment/replacement metadata where verified |

These are maximum intervals, not a reason to delay response to a trigger. A source becomes stale at its `next_review_due_at` date if it has not passed the required manual check.

### 7.4 Immediate re-verification triggers

Immediate re-verification is required after a verified or credible notice/event concerning an amendment, repeal, substitution, replacement, official correction, commencement notification, withdrawal, revocation, source-hash change, material extraction correction, authority/domain change, broken official source link, or credible conflict between relevant sources. A re-verification creates a new review record and, when text/effect changes, a successor source or legal-instrument version.

### 7.5 Verification freshness, stale status, and revocation

Each verified source version must have a source-category-specific verification interval and a `next_review_due_at` date set by approved policy. A source becomes `stale` when that date passes without a successful currentness check, or immediately when a monitored event indicates a possible amendment, repeal, withdrawal, revocation, replacement, or source-hash change.

`stale`, `superseded`, `disputed`, `withdrawn`, `revoked`, `unavailable`, and `broken-link` sources remain preserved for historical provenance but are ineligible to support a statement that material is current law. They must be excluded from MVP AI evidence packets unless an answer is explicitly historical, identifies the status, uses the relevant `as_of_date`, and meets the same verified Rank A and source-span requirements.

A broken URL does not revoke the stored snapshot. It creates a monitoring record, retains all prior source identifiers, URLs, hashes, and citations, and triggers re-acquisition from the verified official authority. A withdrawn or revoked source must retain its last verified snapshot, the revocation/withdrawal source span where available, status-change time, reviewer decision, and replacement/successor link if known.

## 8. Exceptional and Data-Quality Rules

### 8.1 Conflicting sources

Preserve conflicting source records, their authority ranks, snapshots, dates, and exact conflict description. Prefer the higher-ranked verified source for retrieval only when it directly resolves the conflict. Otherwise mark the material disputed, provide no definitive legal proposition, and route it for reviewer assessment.

### 8.2 Outdated, amended, repealed, and historical material

Historical and superseded material remains searchable with its status and effective dates. It must not be silently replaced with current text. Amendments, repeals, partial commencements, substitutions, and corrections are modeled as source-backed events that connect predecessor and successor versions.

### 8.3 Effective-date and territorial-scope integrity

Effective/applicability records must be scoped to an instrument version or versioned provision and contain `effective_from`, optional `effective_to`, jurisdiction/territory, operation scope, source span, and verification status. An instrument-wide date must not be copied to a provision when a source defines provision-specific or partial commencement.

Partial commencement must identify the affected provision(s), territory or local area, commencement source, and effective start date. Territorial applicability must use explicit jurisdiction records; an inherited scope is permitted only when the enabling/source relationship is verified and no source-backed exception is recorded.

For any one versioned provision and jurisdiction scope, verified applicability periods must not overlap. Overlap is permitted only when the records are explicitly marked `disputed`, retain the conflict reason and sources, and are excluded from a current-law answer until resolved. A null end date is permitted only for the latest non-superseded period in that exact scope.

### 8.4 Missing official documents and broken links

If an official document cannot be found, acquired, or verified, record the attempted source reference, date, reason, and status such as `unavailable` or `broken-link`. Do not reconstruct, fill in, summarize as law, or have AI infer the missing text. A mirror may be retained only under its authority rank and verification limits.

### 8.5 Duplicate documents

Compare official identifier, issuing authority, publication date, normalized title, source hash, and version metadata before registering a new source. Exact duplicates link to the existing source/version; differing snapshots are retained as distinct acquisitions and sent for review. Never deduplicate merely on title alone.

### 8.6 Translations

Retain original language/script and the exact source snapshot. An official translation is registered as its own source version with a verified link to the original where possible. A non-official or machine-assisted translation must be marked derived/informational, identify its method and reviewer status, and cannot be the sole authority for a published legal proposition.

### 8.7 OCR and extraction errors

OCR output and automated extraction are derivatives, never replacements for the source snapshot. Store extraction confidence/issues, page mapping, method/version, and reviewer comparison status. Material with unresolved text errors remains unpublished or clearly restricted; AI retrieval must use only reviewer-approved source spans.

## 9. Connection to the Legal Knowledge Base

The registry supplies verified document, snapshot, and version provenance to the model in [LEGAL-KNOWLEDGE-BASE-SPEC.md](LEGAL-KNOWLEDGE-BASE-SPEC.md).

The relationship is:

```text
Legal Source Registry
  → verified source record + immutable snapshot + pinpoint locator
  → legal instrument/version + provision lineage + citations
  → Legal Knowledge Base
  → bounded AI evidence packet and user-facing source trace
```

The knowledge base may create structured provisions, annotations, relationships, judgments, and amendment events only when each is linked to verified registry records and source snapshots. Registry status changes must be visible to the knowledge base so superseded, disputed, unavailable, or withdrawn sources cannot silently support a current legal answer.

## 10. AI Retrieval and Safety Rules

- For MVP legal propositions, retrieve only verified Rank A source snapshots with current eligible status, known jurisdiction, exact version, verified applicability period, and exact source span.
- Build a bounded evidence packet containing only the approved source text/spans, document identifier, source version/snapshot hash, jurisdiction, language, authority rank, effective/applicability dates, freshness status, and pinpoint citations.
- Deterministically validate every cited source identity, provision/version identity, provision-lineage or amendment-effect link where relevant, source span, jurisdiction, date, verification state, authority rank, and freshness status before display.
- Block any legal claim not grounded in a retrieved verified source span. Do not label unsupported generated text as unverified law.
- When material is missing, broken, stale, withdrawn, revoked, conflicting, outdated, translated without approved support, or extraction quality is unresolved, state the limitation and avoid a current-law legal proposition.
- Preserve AI retrieval and validation logs for audit, while minimizing sensitive user data and not retaining it unnecessarily.

## 11. PostgreSQL-Ready Data Model

The registry is compatible with PostgreSQL and conventional relational modeling. Use UUID primary keys, timestamps, normalized relationship tables, strict foreign keys, and JSONB only for variable publisher-specific metadata.

| Table | Purpose | Integrity notes |
|---|---|---|
| `source_authorities` | Issuers, publishers, courts, and official domains | unique authority identity/domain as applicable |
| `authority_rankings` | Source class/rank policy and approval status | versioned policy records |
| `source_documents` | Stable source identity and common metadata | unique approved official identifier/scope where available |
| `source_document_versions` | Immutable version/status/date metadata | no in-place source text replacement |
| `source_snapshots` | Acquired bytes/reference, hash, acquisition, and retention metadata | unique hash per content algorithm; append-only |
| `source_locators` | URL, Gazette, page, paragraph, section, and court locators | linked to snapshot/version |
| `source_spans` | Immutable pinpoint ranges in source snapshots and extracted text | required for published legal assertions |
| `source_jurisdictions` | Territorial and court applicability | supports multiple scoped links |
| `source_applicability_periods` | Version/provision-specific effective dates, partial commencement, and territorial scope | non-overlapping verified periods per scope |
| `source_languages` | Source language/script and translation metadata | links original and derived records |
| `source_relationships` | Successor, replacement, enabling, amendment, repeal, translation, and duplicate links | source-backed typed relation |
| `amendment_effects` | Amendment document to affected/successor instrument and provision versions | source span, operation, date, territory, and lineage required |
| `extraction_runs` | Native/OCR/manual extraction metadata and quality status | linked to immutable snapshot |
| `verification_reviews` | Append-only reviewer evidence, decision, status, and scope | reviewer and snapshot required |
| `monitoring_checks` | Availability, hash, and currentness checks | preserves check history |
| `courts` | Court hierarchy, level, and jurisdiction metadata | parent court and jurisdiction links |
| `judgment_metadata` | Case-specific court, bench, date, and citation data | one or more source document versions |

Required constraints include unique source snapshot hashes, uniqueness for official identifiers within authority/jurisdiction scope, foreign keys for all provenance links, checks that end dates do not precede start dates, and exclusion or equivalent constraints preventing overlapping verified effective ranges for the same versioned provision and jurisdiction scope unless explicitly marked disputed. A published assertion must have a foreign key to a verified `source_span`; an `amendment_effect` must have foreign keys to its amendment source version/snapshot/span and its affected/successor provision version(s), unless it is explicitly source-backed as instrument-wide. Index source identifier, authority, jurisdiction, status, next-review date, effective dates, hash, normalized title, official citation, and full-text extraction fields.

## 12. Fictional Example

The following is fictional and must not be interpreted as Indian law, a real publication, or a real source.

```text
Source document:
  source_id: src-demo-001
  category: state_act
  instrument_title: "Sample Regional Procedure Act"
  document_identifier: "Example Act 7 of 20XX"
  jurisdiction_scope: "Example State"
  source_language: "Example Language"
  authority_rank: A
  status: verified

Source version/snapshot:
  source_version_id: srcv-demo-001
  version_identifier: "Gazette-demo-2026-01"
  publication_date: 2026-01-10
  effective_date: 2026-02-01
  snapshot_hash: "sha256:fictional-hash-only"
  source_url_or_reference: "https://example.invalid/gazette/demo"
  extraction_method: "manual comparison of fictional source"
  reviewer: "reviewer-demo"
  verification_date: 2026-01-12
  last_checked_date: 2026-01-12

Successor relationship:
  relationship_type: "amended_by"
  successor_source_version: srcv-demo-002
  status: "future fictional version; not current"

AI result rule:
  "Only text linked to srcv-demo-001 and a verified source span may be cited."
```

## 13. MVP and Later-Phase Scope

### MVP requirements

- Manual candidate registration and source acquisition.
- Local/controlled immutable snapshots and cryptographic hashes where feasible.
- Manual extraction and reviewer comparison for a small curated corpus.
- PostgreSQL source metadata, version, citation, review, and relationship tables.
- Verified Rank A primary-source eligibility, exact source-span grounding, freshness checks, and citation-first legal knowledge-base linkage.
- Source-backed amendment effects and non-overlapping provision/jurisdiction applicability periods.
- No paid APIs, subscriptions, automatic download services, or AI dependency required.

### Later-phase requirements

- Automated discovery, scheduled monitoring, and amendment alerting.
- OCR pipelines, advanced extraction quality scoring, and multilingual alignment at scale.
- Source-change diffing, duplicate-detection assistance, and source graph visualizations.
- Reviewer workflow interfaces, multi-person approval, and professional editorial operations.
- Optional AI-assisted extraction or retrieval, subject to the same source-bound validation and privacy controls.

All later-phase work requires separate approval for cost, privacy, security, legal-source quality, and operational impact.
