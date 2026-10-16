# Tasks

## 1. Row-level busy indication

- [x] 1.1 In `work-doc-list.html`, render an inline `ob-spinner` (no `fixed`) in the status cell of busy rows, replacing the status label, with the translated status key (`koby.work.status.busy`) as its accessible name; verify a unit test covers the spinner replacing the label and the accessible name on busy rows
- [x] 1.2 Adjust `work-doc-list.scss` so the status cell hosts the spinner inline and vertically centered; keep the `--failed`/`--done` label styling unchanged; verify visually via the dev server and unit tests still pass
- [x] 1.3 Verify the spinner appears when its channel is already active (a spinner instantiated after `activate` reflects the active channel); if it does not, apply the fallback ordering from design D2 and re-verify with the unit test

## 2. Busy card removal

- [x] 2.1 Remove the `app-work-busy` card: delete `work-busy.ts`/`work-busy.html`/`work-busy.scss`, drop the `@if (busyDocument()...)` block from `work.html`, and remove the now-unused `busyDocument` binding; verify the build has no missing-provider or unused-symbol errors
- [x] 2.2 Simplify the spinner wiring in `work.ts` (keep the `work-analysis` channel effect; drop work-busy references); verify a unit test covers channel activation while a document is busy and deactivation when none is
- [x] 2.3 Update `work.spec.ts`: replace the `busy-state`/`busy-label` assertions with row-level ones (busy row shows spinner, page stays interactive, cancel from the row still removes the document with notification); verify the full test suite passes

## 3. Integration check

- [x] 3.1 Run the full test suite and the build; verify with the dev server that multiple simultaneous busy documents each spin on their own row while the rest of the page remains interactive
