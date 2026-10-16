# Design

## Context

`classify-ui` is an NgModule-based Angular 22.2 app on Oblique 16 (`ob-master-layout`, ngx-translate de/fr/it, vitest, Docker via nginx on port 4200). It currently renders the review workbench (`/work`, `/rules`) entirely from `MockClassificationService` — fixtures, a fake four-stage timer, and fabricated confidence/evidence data. The Classify Service now exposes a real `POST /v1/classify` (multipart, field `file`) returning `{ isg_isv, dsg }` with classifications, `reasons[]`, `legal_basis[]`, DSG `findings[]` (type/category/count) and `profiling`/`high_risk_profiling` detection status. The frontend has `provideHttpClient` + `ObHttpApiInterceptor` already registered and an `apiBaseUrl` in every environment, but no HTTP calls are issued. See proposal.md for motivation and scope.

## Goals / Non-Goals

**Goals:**
- Swap the simulated data layer for a real HTTP client behind the same component seam, mapping the real response onto the review cards.
- Keep the workbench's Oblique-native structure, i18n, routing, and Docker delivery.

**Non-Goals:**
- No backend changes: the UI adapts to the existing `POST /v1/classify` contract.
- No confidence/distribution, no evidence quotes, no document preview (no backend source).
- No persistence; document state stays in component memory.

## Decisions

**D1 — One real service behind the same seam.** `MockClassificationService` (and `mock/` fixtures) are replaced by a `ClassificationService` exposing the same signals and methods (`documents`, `selectedId`, `rejections`, `validate`, `addFiles`, `cancel`, `select`) so the work components change minimally. The document model loses the fixture-only fields (`sampleId`, `tag`, `pages`) and gains a `failed` status.
*Alternative considered:* keep the mock alongside a real service. Rejected: two sources of truth and dead fixtures.

**D2 — Response mapping (single file).** A pure mapping function turns `{ isg_isv, dsg }` into the review model:

| Backend value | Review model |
|---|---|
| `isg_isv.classification` `unclassified`/`internal`/`confidential`/`secret` | ISG tiles nicht klassifiziert / intern / vertraulich / geheim; `geheim` rendered only for `secret` |
| `isg_isv.reasons[]` | justification list |
| `isg_isv.legal_basis[]` | references |
| `dsg.classification` `no_personal_data`/`personal_data`/`sensitive_personal_data` | DSG tiles keine / Personendaten / besonders schützenswerte |
| `dsg.profiling`, `dsg.high_risk_profiling` | profiling readout (`nicht erkannt`/`möglich`/`erkannt`) |
| `dsg.findings[]` | findings list (category + count) |
| `dsg.reasons[]`, `dsg.legal_basis[]` | justification list + references |

Canonical API values (`unclassified`, `personal_data`, `nicht erkannt`, …) are mapped to i18n keys for the display labels; the raw values remain in the "Befund als JSON" panel unchanged.

**D3 — Document state model.** Per document: `id`, `name`, `size`, `ext`, `status` (`busy` | `pending` | `failed`), and `result` or `failureReason`. There is no stage index; the busy state is a single pending indication.

**D4 — HTTP mechanics.** `FormData` with the `file` field; `Accept-Language` set from the active ngx-translate language (de/fr/it) so `reasons` return translated; base URL from `environment.apiBaseUrl` (dev `http://localhost:8000`, prod `''`). Each document keeps its own `AbortController`; `cancel` aborts it and removes the document. `withXhr()` is already enabled; `ObHttpApiInterceptor` stays.

**D5 — Busy/cancel.** The four-stage `<ol>` and timer pipeline are removed. The busy state shows an `ob-spinner` and a single "Analysiere…" label; cancellation aborts the in-flight request. The spinner channel (`work-analysis`) stays active while any document is `busy`.

**D6 — Error handling.** Map failures to a visible `failed` document state with a translated reason: network/no response → service unavailable; HTTP 413 → document too large/long; 415 → unsupported type (belt-and-braces behind client pre-validation); 422 → unreadable/empty document; 502 → model could not produce a valid result. A failed document is removed on cancel/dismiss; other documents are unaffected.

**D7 — Production wiring.** `environment.prod.ts` stays `apiBaseUrl: ''` (same-origin) and `nginx.conf` gains a `location /v1/ { proxy_pass http://classify-service:8000; }` block so the Docker deployment reaches the service without CORS. This supersedes the earlier CORS-only integration (ADR 0002) for production: dev keeps direct `:4200 → :8000` CORS, prod proxies same-origin.

**D8 — Size and format alignment.** The drop zone accepts exactly `pdf`, `docx`, `md`, `txt` and a 10 MB limit, matching the service's extraction and upload limits.

## Risks / Trade-offs

- [Real classification is slow (LLM, tens of seconds to ~2 min)] → single honest pending state; per-document cancel via AbortController; no fake progress.
- [Multiple concurrent documents multiply KOBY requests] → the service already runs ISG+DSG in parallel per request; concurrency is bounded by the user's document count (same as today's parallel per-document pipeline).
- [The model can return `secret` (geheim), which the demo treated as never-proposed] → geheim is now a real, conditionally shown proposal; the rules screen documents it as escalation-only (Art. 24 ISV).
- [No confidence means reviewers lose the "how sure" signal] → out of scope; reasons + legal basis carry the justification instead; revisit if the contract later adds confidence.
- [Fixtures removed, so the "tag" and page-count columns disappear] → document list shows file name/size/type only; acceptable for the real flow.
- [prod same-origin proxy is a new moving part] → mirror it in `docker-compose` testing (task 5.x); dev still exercises the CORS path.

## Migration Plan

1. Add `ClassificationService` (HTTP client + mapping) and the `failed` status; replace `mock/`; update `work` components for the simplified review (no confidence/evidence, DSG 3 tiles + profiling readout, single busy state, findings list, geheim-conditional tile).
2. Update the rules screen copy (geheim escalation, DSG profiling definitions, principles card without confidence/evidence).
3. Add the nginx `/v1` proxy and confirm `docker compose up --build` reaches the service on the real response.
4. Extend i18n for the changed chrome and the "real proposal, no legal effect" labelling; update tests (drop `mock-classification.spec.ts`, add `HttpClient`-mocked service tests and component tests).

Rollback: revert the change; the workbench returns to the demo layer only if the mock service is restored (it is deleted here), so rollback is a full revert rather than a config toggle.
