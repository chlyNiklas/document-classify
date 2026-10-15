# Tasks

Because this change documents already-implemented behavior, its work is review/validation of the spec against the code, not implementation.

## 1. Spec accuracy review

- [x] 1.1 Read `openspec/changes/document-classify-ui/specs/classify-ui/spec.md` against `classify-ui/src/app/home/home.ts`, `home.html`, and `app-module.ts` and confirm every requirement matches the implementation; correct any mismatched detail in the delta — verify each scenario is true by code reading (observable behavior, not internals)
- [x] 1.2 Cross-check the upload contract (`POST /v1/classify/document`, field `file`, accepted `.pdf`/`.docx`/`.txt`, single file) against `docs/adr/0001`, the components, and ADR 0002's deviation notes — verify no spec text contradicts the recorded decisions

## 2. Artifact validation

- [x] 2.1 Run `openspec validate document-classify-ui` and fix any structural findings (scenario header levels, requirement descriptions over 500 chars) — verify the command exits clean
- [x] 2.2 Run the full Docker flow `docker compose up --build -d` and confirm the Docker delivery scenarios in the spec (UI on :4200 with SPA fallback via a non-root path returning the app shell, service on :8000) — verify each Docker delivery scenario by observing the running stack

## 3. Archive into the main spec

- [x] 3.1 After review, archive the change with `openspec archive document-classify-ui` so `openspec/specs/classify-ui/spec.md` becomes the main spec — verify `openspec spec show classify-ui` lists all ten requirements from this delta
