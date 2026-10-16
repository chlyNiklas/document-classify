# Proposal

## Why

The document-review workbench carries surface the end users do not need: a second navigation section ("Regelwerk") that is a static rules reference rather than part of the classification flow, an extra "Weiteres Dokument hochladen" action that duplicates the always-visible intake drop zone, and a hint sentence in the empty document list that restates the drop zone. Reducing the surface keeps the Arbeitsbereich focused on the single job — add a document, review the proposal — and removes a whole route, its component and its translation set from the maintenance burden.

## What Changes

- Remove the **Regelwerk** section entirely: the `Regelwerk` main-navigation item, the `/rules` route, the `Rules` component (template, styles, spec), its `Rules` declaration in `AppModule`, and the `koby.rules.*` translation keys. `/work` (Arbeitsbereich) becomes the only route and the only navigation item.
- Remove the **"Weiteres Dokument hochladen"** action from the review footer: the button, the hidden `<input type="file">`, the `addMoreDocument()` / `readMoreFiles()` handlers, the `koby.work.upload-more` key, and the corresponding `work.spec.ts` test. Adding documents remains available through the intake drop zone.
- Remove the **empty-list hint sentence** ("Fügen Sie links ein Dokument hinzu, um die Analyse zu starten." and its fr/it equivalents): keep the empty-state area in the document list, but drop the sentence and the `koby.work.empty` key.
- Update the `classify-ui` capability accordingly: the entry point and navigation requirements lose the Regelwerk route/item, the `Rules reference screen` requirement is removed, and the purpose no longer names Regelwerk.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `classify-ui`: The single-feature entry point and workbench navigation no longer include the `/rules` route or the "Regelwerk" navigation item; the "Rules reference screen" requirement is removed; the purpose text drops the Regelwerk reference.

## Impact

- `classify-ui/src/app/app.html` — navigation items.
- `classify-ui/src/app/app-routing-module.ts` — `/rules` route and `Rules` import.
- `classify-ui/src/app/app-module.ts` — `Rules` import and declaration.
- `classify-ui/src/app/rules/` — `rules.ts`, `rules.html`, `rules.scss`, `rules.spec.ts` (deleted).
- `classify-ui/src/app/app.spec.ts` — navigation assertion referencing `/rules`.
- `classify-ui/src/app/work/work-review.html` / `work-review.ts` — upload-more action and handlers.
- `classify-ui/src/app/work/work-doc-list.html` / `work-doc-list.scss` — empty-state sentence.
- `classify-ui/src/app/work/work.spec.ts` — upload-more test.
- `classify-ui/src/assets/i18n/{de,fr,it}.json` — `koby.rules.*`, `koby.chrome.navigation.rules`, `koby.work.upload-more`, `koby.work.empty` keys.
- `openspec/specs/classify-ui/spec.md` — updated by the change's delta spec on archive.

No backend, API, dependency or delivery changes.
