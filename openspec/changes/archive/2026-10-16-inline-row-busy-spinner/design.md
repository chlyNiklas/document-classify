# Design

## Context

Today the busy indication is a full-screen overlay: `work-busy.html` renders `<ob-spinner [channel]="work-analysis" [fixed]="true" />` in a card shown by `work.html` while any document is `busy`; the `Work` effect activates/deactivates the `work-analysis` channel accordingly. The document table (`work-doc-list`) shows a status label per row plus a cancel button for busy rows. Oblique 16's `ob-spinner` without `fixed` renders inline within its container instead of overlaying the viewport. See proposal.md — Why for the motivation.

## Goals / Non-Goals

**Goals:**
- Busy feedback lives on the corresponding table row only; the rest of the page stays interactive.
- Cancel stays reachable from the busy row (it already is — reuse the existing row action).
- Keep the change minimal: reuse the existing `work-analysis` channel logic.

**Non-Goals:**
- No per-row spinner channels (the "any document busy" channel semantics are sufficient; every busy row renders its own spinner).
- No changes to the classification service, cancellation flow, or notification behavior.
- No restyling of the table beyond the status cell.

## Decisions

- **D1 — Inline spinner in the status cell, replacing the label.** Busy rows render `ob-spinner` (no `fixed`) inside the status cell with the translated status key as its accessible name (`ariaLabel` input); non-busy rows keep the plain label. The "replaces" variant (over "next to") was chosen for a cleaner look; accessibility is preserved via the accessible name.
- **D2 — Conditional rendering instead of per-row channels.** The spinner only exists in the DOM for busy rows, so the existing single `work-analysis` channel still works: only rendered spinners appear. Per-document channels (`work-analysis-<id>`) were considered but add channel-management complexity for no user-visible gain. Caveat to verify: a spinner instantiated *after* its channel is activated must still appear — covered by a unit test; if it does not, the effect's activate/deactivate ordering (activate after render via `afterRenderEffect` or re-activation on row change) is the fallback.
- **D3 — Remove the busy card entirely.** `work-busy.ts/.html/.scss` are deleted and the `@if` block removed from `work.html`; `Work.busyDocument` and the `workSpinnerChannel`/spinner references move accordingly. The row already carries the cancel action, so nothing is lost; the `Work` effect stays in `work.ts` to drive the channel.
- **D4 — Status cell styling cleanup.** The `doclist__status--busy` text styling becomes the spinner container (inline, vertically centered with the row); the `--failed`/`--done` variants are untouched.

## Risks / Trade-offs

- [Spinner added after channel activation may not appear] → Unit test asserting the busy row shows a spinner while the channel is active; fallback ordering per D2.
- [Losing the visible "In Analyse" text] → The spinner's accessible name keeps the status translatable and reachable for assistive tech; sighted users get the unambiguous spinner.
- [Multiple simultaneous busy documents all spin] → Intended: each busy row reflects its own document's state; they all share one channel, which matches the "analysis running" semantics.
