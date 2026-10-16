# Proposal

## Why

The Classify UI (Angular 22 + Oblique 16 starter) still shows the raw-plumbing baseline: one file, one POST, one verbatim response dump. The reviewed design (prototype `classify-ui/Dokumenten-Classifier - Prototyp.html`) defines the intended end-user experience — a document-review workbench with per-document proposal cards for ISG classification and DSG assessment, traceable findings and a rules screen. The UI should reach that target experience now, while the classification backend still returns only two fields (`klassifizierung`, `begruendung`). Bringing the full frontend up on a simulated demo layer today decouples the UI build from backend schema work; wiring the richer data for real is a separate later change.

## What Changes

- Replace the Home page with a two-route workbench inside the Oblique master layout: `/work` (Arbeitsbereich) and `/rules` (Regelwerk) as main-navigation items.
- `/work` becomes the review flow of the prototype: a documents card with per-document status badges, an upload drop zone accepting multiple files, an error alert, a simulated 4-step analysis with progress indication and per-document cancel, and review cards for ISG (4 category tiles, `geheim` shown but disabled and never proposed) and DSG (5 assessment tiles) with confidence, justification and collapsible evidence quotes ("Im Dokument anzeigen" opens a document preview with highlighted findings); a Befund-JSON off-canvas shows the simulated classification response; a footer disclaimer states results carry no legal effect.
- `/rules` renders the classification rules reference: the ISG category table (which categories the AI proposes and which never), DSG definitions (Art. 5 DSG categories incl. "besonders schützenswerte Personendaten"), how confidence / justification / findings work, and the model/operations card (internal deployment, no data leaves the perimeter).
- Master-layout entry point gains the "Hinweise zur Prüfung" guidance (popover/off-canvas) and success/info/error notifications replace ad-hoc messaging.
- All results come from a simulated demo data layer: fixture sample documents and a fake analysis pipeline. The real `POST /v1/classify/document` wiring is parked (code stays, no call is issued by the workbench) until a later change defines the richer response contract.
- Visual language is clean Oblique native (master layout chrome, Oblique components, Oblique SCSS variables). The prototype's hand-rolled design system ("Oblique NEXT 2": Sora display font, raspberry accent, glass topbar, custom tokens) is **not** carried over.
- Broken/intentionally dropped: single-document upload, verbatim response display and raw-failure display of the old spec (superseded by the demo workbench, see Modified Capabilities); the confirm/history flow of the prototype script is **out of scope**, as is any backend schema work.

## Capabilities

### New Capabilities

- (none — the workbench belongs to the existing end-user surface capability)

### Modified Capabilities

- `classify-ui`: the end-user surface changes from the single-document upload/receipt to a multi-document demo workbench. Requirement changes: document intake accepts multiple supported files; the pending state becomes a visible simulated analysis pipeline; the verbatim result display and raw-failure honesty rules are replaced by structured, clearly simulated review results (labelled "no legal effect"); the home entry point becomes the two-route workbench. Unchanged but still applying: trilingual UI with German default, configurable base URL (parked, no calls issued in the demo), Docker delivery on port 4200.

## Impact

- **Code:** `classify-ui/src/app` — routing (`/work`, `/rules`, drop `/home`), `home` component replaced by `work`, `rules` and shared mock/service components; i18n bundles (`de/fr/it.json`) extended; global/component SCSS minimal additions using Oblique SCSS variables (tile grid, badge pill, evidence highlight); `app.html` master-layout navigation.
- **Dependencies:** none new — all building blocks already ship with `@oblique/oblique` 16.0.2 (master layout, alerts, notification service, drop zone, spinner, progress bar, popover, off-canvas, collapse, selectable tiles).
- **Backend (`classify-service`):** untouched; the workbench issues no classify requests in the demo.
- **Infrastructure:** Docker Compose delivery and build configurations unchanged.
- **Data:** no persistence; document state lives in component memory (reload resets the session).
