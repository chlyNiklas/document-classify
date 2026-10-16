# Proposal

## Why

The classification basis is presented to end users as "gemäss ISG" (the Gesetz), but the operative classification criteria — Art. 18–20 ISV and the Art. 24 ISV escalation rule — come from the Verordnung (ISV, SR 128.1). The project must classify according to the Verordnung, so the user-facing labelling must name the ISV, not the ISG. The underlying legal substance (categories, escalation rule, model output legal-basis citations) does not change.

## What Changes

- Relabel the user-facing classification surface from ISG to ISV in all three languages (de-CH, fr-CH, it-CH):
  - Review card title in the Arbeitsbereich: "Informationssicherheit (gemäss ISG)" → "(gemäss ISV)".
  - Regelwerk section title "ISG" → "ISV" and the subtitle "Kategorien nach ISG" → "Kategorien nach ISV".
  - Regelwerk "Grundlage/Artikel" column for the four categories: ISG articles (Art. 11–14 ISG) → ISV articles (Art. 18–20 ISV; "geheim" Eskalation: Art. 24 ISV), consistent with the table note ("Kategorien nach Informations-Sicherheits-Verordnung") and the loaded rulebook.
  - Principles text "ISG/ISV- ... DSG-Artikel" → "ISV- ... DSG-Artikel" wording.
- Fix the Italian translations that cite the repealed Verordnung "OSII" (Art. 24 OSII, ISG/OSII articles) to ISV.
- No API contract change (`isg_isv` response field and its values stay), no classify-service change (rulebook, prompts, models, validation untouched), no TypeScript identifier renames.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `classify-ui`: The "ISG proposal review" requirement is retitled/relabelled to the ISV basis; the "Rules reference screen" requirement changes from "the ISG category table" with legal basis articles to the ISV category table with Art. 18–20 ISV basis and the unchanged Art. 24 ISV escalation rule.

## Impact

- `classify-ui/src/assets/i18n/de.json`, `fr.json`, `it.json` — string changes only.
- `classify-ui` spec (`openspec/specs/classify-ui/spec.md`) — requirement wording for the two affected requirements.
- UI tests asserting on the relabelled strings/rules table (e.g., `rules.spec.ts`).
- Unaffected: `classify-service` (rulebook, KOBY prompts, response schema), TypeScript models and component names (`isg`-prefixed identifiers remain internal), API contract.
