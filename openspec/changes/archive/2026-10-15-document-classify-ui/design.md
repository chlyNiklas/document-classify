# Design

## Context

The change is retro-documentation: the Classify UI already exists and runs (`classify-ui/`, Angular 22 + Oblique 16). Its decisions are already recorded in `docs/adr/0001-ui-uploads-file-and-displays-raw-classification.md` and `docs/adr/0002-angular-oblique-cors.md`, and the shared vocabulary in `GLOSSARY.md`. OpenSpec holds no specs yet, so this change creates the first main capability spec. See proposal.md for the why.

## Goals / Non-Goals

**Goals:**

- Capture the Classify UI's implemented, externally observable behavior as the `classify-ui` capability spec, sourced from code inspection and the existing ADRs.
- Keep the spec honest about the known gap: the multipart classify endpoint the UI codes against is not implemented in `classify-service/` yet, so the spec pins the designed failure path (raw error display) instead of describing a non-existent success path.

**Non-Goals:**

- No code changes, no behavior migration, no deprecation of anything (there is nothing prior).
- No documentation of `classify-service` internals here — the service deserves its own capability spec when documented.
- No UX redesign discussion; the verbatim display is documented as-is because that is what was decided (ADR 0001), not how it will eventually look.

## Decisions

- **Capability boundary: one `classify-ui` spec.** The UI (upload + display + languages + delivery) is one cohesive user-facing behavior set; splitting the Docker delivery or languages into separate capabilities would fragment a single surface. Alternative rejected: a broad `document-classify` capability spanning UI *and* service — the service's contracts are the UI's inputs, but the service has its own lifecycle and should own its own spec later.
- **Specs describe behavior, not the Angular/Oblique implementation.** Framework names and signal/module details stay out of the delta so the underlying implementation can change without invalidating the spec. Only contract-level identifiers appear: the URL `/v1/classify/document`, the multipart field `file`, the accepted formats, the port 4200/8000 split, and the de-CH/fr-CH/it-CH languages — all externally observable.
- **Document current truth, not aspirations.** Where the UI is deliberately temporary (verbatim JSON result panel), the spec records the exact settled behavior; future redesigns then open a new change with a MODIFIED requirement instead of ambiguity.

## Risks / Trade-offs

- **Spec drift** (code changes while this documentation change is open) → Archive promptly after review; further work goes through new changes with deltas.
- **The assumed endpoint may change shape** when `classify-service/` implements it (e.g. different path or extra fields) → The spec pins path/field name explicitly so that mismatch shows up as a spec change at implementation time, not a silent UI break.
- **Over-precision in scenarios** (e.g. exact ports) → Ports reflect the only environment defined today (local dev/Compose); cloud deployments will need a MODIFIED delta when they exist.

## Risks / Trade-offs note on scope

- Pure documentation change: no migration plan, no deployment steps.

## Open Questions

None.
