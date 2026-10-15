# Design

## Context

`classify-ui` is an NgModule-based Angular 22.2 app on the Oblique design system (`@oblique/oblique` 16.0.2, master layout, ngx-translate de/fr/it, vitest, Docker delivery via nginx on port 4200). Its only page (`home`) drops one file and renders the raw classify response. The Oblique 16 package provides the building blocks needed here — master layout, `ob-alert`, `ObNotificationService`, `ob-drop-zone`, `ob-spinner`, `ob-progress`, `OffCanvasService`, `obCollapseHeader/Main`, `obSelectable` — but no tabs, table, badge or stepper components, so those areas are plain templates styled with Oblique SCSS variables. The prototype (`Dokumenten-Classifier - Prototyp.html`) defines the target screens on a hand-rolled CSS system that will not be carried over. See proposal.md for the motivation and scope.

## Goals / Non-Goals

**Goals:**
- Reach the prototype's Arbeitsbereich and Regelwerk experience using Oblique-native components, on a simulated demo data layer that is the single seam for later real wiring.
- Keep everything that already works: master-layout chrome, ngx-translate, environment configs, Docker delivery, vitest tests.

**Non-Goals:**
- Real HTTP classification from the workbench (parked; a later change re-introduces the upload contract on the richer schema).
- The prototype's custom visual system (Sora font, raspberry accent, glass topbar, gradients).
- Adjust/confirm flow, review history, persistence across reloads, backend schema changes.

## Decisions

**D1 — Demo data layer as one injectable service.** A new `MockClassificationService` owns fixture sample documents (ported from the prototype's `KOBY_DATA` sample set: press release, citizen letter, order, medical letter, meeting minutes, network document …), the fake analysis pipeline (ordered stages on timers, cancellable per document) and per-document review results (ISG level + confidence distribution + justification, DSG assessment + confidence, evidence quotes with page/paragraph and marker letters, simulated JSON response object). Components subscribe via signals and hold no pipeline logic.
*Alternative considered:* spreading simulation state across components (as the prototype script does). Rejected: one service makes the later swap to a real HTTP client a single-file change and keeps components testable.
*Note:* classification requests from the old `home.ts` are not kept in a dormant state — the workbench issues no HTTP calls; the later wiring change will add an `HttpClassificationService` behind the same interface.

**D2 — Component mapping (Oblique-native wherever the package has an answer).**

| Prototype element | Implementation |
|---|---|
| Custom topbar + tabs | `ob-master-layout` main-navigation items `/work`, `/rules`; header keeps demo badge + help action |
| Toasts | `ObNotificationService` (`info` for cancel, `success` for copy/save-style feedback) |
| Info alert | `ob-alert` info, with the guidance action |
| Drop zone | `ob-drop-zone` (multiple files, accept list per spec) |
| Busy state | `ob-spinner` (live pipeline) + `ob-progress` (stage completion) + ordered `<ol>` stage list |
| Review cards | Custom cards styled with Oblique SCSS variables (surface card, muted category box) |
| ISG/DSG tiles | Non-interactive tiles: proposal tile highlighted with the Oblique selection tint; `geheim` tile permanently muted. No radio group — the visible subset has no editing |
| Rule finding (Evidence) | `obCollapseHeader`/`obCollapseMain` accordion; quotes with marker letters as earlier proposed |
| Guidance, document preview, findings JSON | `OffCanvasService.open(...)` — one consistent overlay pattern for all three (four-point advisory list; document preview with highlighted quotes; JSON + copy). `ob-popover` was considered but is too small for the document preview content |
| Status badges (Analyse / Result / Confirmed) | Small `.badge` pill styles from Oblique SCSS variables (no Oblique badge component in v16) |
| Rules tables | Plain semantic `<table>` styled with Oblique variables |

**D3 — Routing.** `'' → redirect '/work'`; `/work → WorkComponent`; `/rules → RulesComponent`; `**` stays Oblique unknown-route. The `home` route and component are removed.

**D4 — State model.** Per document: `id`, name/size/format, `status` (`busy` / `pending`), analysis stage index, and the review result once available. Held in the service as signals; the selected document is also a signal. Session state ends on reload (no storage) — matches prototype behavior and keeps the demo honest.

**D5 — i18n.** Extend the existing `i18n/{de,fr,it}.json`: all workbench chrome (labels, buttons, care announcements, rule texts, guidance) translated in all three languages; fixture content (document names, quotes, justifications) remains German because it represents uploaded document content, not UI text. Existing language-switch behavior stays from the master layout.

**D6 — Prototype fidelity of behavior over CSS.** Where the prototype relies on its own design tokens (tile widths, confidence badge, KI Premium badge), the Oblique equivalent is: interaction-selected tint for the proposal tile, neutral badge with confidence %, no special AI accent colour.

## Risks / Trade-offs

- [Oblique v16 has no badge/tab/table components] → Acceptable: those areas are plain styled templates; component APIs stay Oblique-compatible, and upgrades to later Oblique versions can replace them.
- [Simulated pipeline timing may distract/violate reduced-motion users] → Keep stage timers short overall (~a few seconds per document), honour `prefers-reduced-motion` implicitly by avoiding decorative animation beyond Oblique defaults.
- [Fixture discipline: "geheim" must never appear as a proposal] → Enforced in the mock service (level values restricted to the three proposal-capable levels) rather than per-fixture edits; covered by a test.
- [German-only fixture content inside a trilingual UI] → Deliberate (document content vs. UI text); documented in the specs' trilingual requirement scope.
- [Off-canvas doc preview must fit long highlighted quotes] → Preview scrolls within the off-canvas; highlight uses neutral marked background, not colour coding that a11y depends on.
- [UI divergence between the prototype's trimmed template and its hidden confirm logic] → Confirmed scope is the visible subset; the prototype's unrendered confirm/history logic is not ported.

## Migration Plan

1. Add the mock service and fixtures; add `/work` and `/rules` components and routes; update master-layout navigation.
2. Port screen content in stages: intake list/drop zone → busy pipeline → review cards → findings/JSON off-canvas → rules screen → guidance/notifications.
3. Extend i18n bundles; adapt `app.spec.ts` and component tests (vitest) to the new routes and demo flows; delete `home`.
4. Visual check inside `ob-master-layout` at all sizes; `docker compose up --build` still serves the demo on port 4200.

Rollback: revert the change; the parked real-wiring seam means the service contract swap is isolated to one service file.
