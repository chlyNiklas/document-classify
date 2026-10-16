# Design

## Context

All classification substance already comes from the ISV (criteria Art. 18–20 ISV, escalation Art. 24 ISV; see proposal.md - Why). The remaining mismatch is purely presentational: i18n strings and the Regelwerk article column name the ISG. The classify-service (rulebook, prompts, validation) and the API contract (`isg_isv`) stay untouched.

## Goals / Non-Goals

**Goals:**
- User-visible text in de/fr/it refers to the ISV basis.
- Regelwerk table "Grundlage/Artikel" entries resolve the existing inconsistency: note already says "Kategorien nach Informations-Sicherheits-Verordnung", so articles become Art. 18–20 ISV (Eskalation Art. 24 ISV).
- Italian OSII references (repealed Verordnung) fixed to ISV.

**Non-Goals:**
- No identifier renames (`isg` i18n keys, `isg_isv` API field, `ISGReviewCard`, `ISGOrder` etc. stay).
- No change to the review-card legal-basis citations (model output).
- No change to the rulebook, prompts, or service validation.

## Decisions

- **Strings only, in all three i18n files.** The keys stay (`koby.work.isg.*`, `koby.rules.isg.*`); only values change. Alternative (renaming keys/components) would touch tests and spec identifiers for zero user value.
- **New basis texts for the Regelwerk column** (there is no translation registry to sync):
  - deutsch: unclassified → "Keine ISV-relevante Information", basis "Art. 18 ISV"; internal → "Art. 18 ISV"; confidential → "Art. 19 ISV"; secret → "Art. 20 ISV · Eskalation: Art. 24 ISV". The old Art. 11–14 ISG basis values are replaced entirely.
  - fr/it: same articles with translated descriptors; `it.json` replaces "Art. 24 OSII" with "art. 24 ISV" and "ISG/OSII" with "ISV".
- **Category meanings keep their plain-language descriptions.** The threshold wording (gering/erheblich/schwerwiegend) stays; it is a paraphrase, not a citation, so no article renumber is needed there.

## Risks / Trade-offs

- [Tests or specs may assert old strings (e.g. "ISG table", subtitle)] → Grep `classify-ui` tests for affected strings and update alongside; the OpenSpec delta already captures the requirement-level wording.
- [Mixed ISG citations can still appear in model-produced legal basis] → Accepted under Option A: the service validation accepts ISG or ISV articles; a later change (Option B) would tighten this.

## Migration Plan

String-only change; deploy with the next UI build. Rollback = revert the i18n files.

## Open Questions

(none)
