# Proposal: Document the Classify UI

## Why

The Classify UI (`classify-ui/`) is implemented and running, but the project records no behavioral specification for it. A spec is needed now so the next evolution (real classification results replacing the raw-JSON display, the still-unimplemented multipart classify endpoint, potential multi-file support) starts from an agreed baseline instead of tribal knowledge.

## What Changes

- Documentation-only change: no runtime behavior is modified.
- Adds the new capability `classify-ui`, capturing the implemented end-user behavior: single-file Document drop (PDF/Word/plaintext), multipart upload to the Classify Service, verbatim display of the Classification response and raw HTTP errors, trilingual UI (de-CH/fr-CH/it-CH) via Oblique/ngx-translate, environment-based API base URL, and the nginx Docker delivery.
- Explicitly documents known gaps as requirements: the assumed multipart classify endpoint does not exist in `classify-service/` yet, so uploads currently fail visibly (by design, per `docs/adr/0001`).
- No code changes in `classify-ui/`, `classify-service/`, or `docker-compose.yml`.

## Capabilities

### New Capabilities

- `classify-ui`: The end-user single-page Angular/Oblique front end for submitting a Document to the Classify Service and displaying the Classification result verbatim. Covers the drop zone contract, upload flow, result/error presentation, language support, configuration, and Docker delivery.

### Modified Capabilities

None — first spec in the project.

## Impact

- Adds `openspec/specs/<classify-ui>/spec.md` (via delta in this change).
- No effect on application code, API contracts, dependencies, or deployment. Referenced but unchanged: `docs/adr/0001`, `docs/adr/0002`, `GLOSSARY.md`, `docker-compose.yml`.
- When this change is archived, the main spec becomes the source of truth for future Classify UI work.
