# Proposal

## Why

While a document is being analysed, a fixed full-screen spinner overlay blocks the entire UI, so the workbench table is visible but unusable even though it is exactly where the user needs feedback. The busy indication should live on the corresponding table row so the rest of the page stays interactive.

## What Changes

- The document table (`app-work-doc-list`) shows an inline `ob-spinner` in the status cell of busy rows, **replacing** the "In Analyse" status label; an `aria-label` keeps the status accessible to screen readers.
- The busy card (`app-work-busy`) — fixed spinner, "Analysiere…" label and cancel button — is **removed**. The row's existing cancel action takes over cancellation.
- The spinner-channel wiring in `Work`/`work-busy` is simplified accordingly (no fixed overlay, no separate busy-state component).
- Unit tests for the busy state (`work.spec.ts`) are updated to the row-level indication; affected SCSS is cleaned up.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `classify-ui`: the "Pending state visible while classifying" requirement changes — the pending indication moves from a page-level busy card into the corresponding document table row (inline spinner replacing the status label), while per-row cancellation stays unchanged.

## Impact

- `classify-ui/src/app/work/`: `work.html`, `work.ts`, `work-doc-list.html`, `work-doc-list.scss`, `work-busy.*` (removed), `work.spec.ts`.
- No API, service-contract or dependency changes; no new Oblique modules (the spinner module is already registered).
- Cancellation flow (`ClassificationService.cancel` + notification) is untouched.
