# Proposal

## Why

The Classify UI workbench (delivered by the `classify-ui-oblique-workbench` change) still runs entirely on a simulated data layer — fixture documents, a fake analysis timer, and fabricated confidence/evidence data. The Classify Service now exposes a real classification endpoint, `POST /v1/classify`, returning a structured ISG/ISV + DSG assessment. The workbench should call that endpoint and show real classification proposals instead of demo data, so the end user reviews the model's actual output.

## What Changes

- Replace `MockClassificationService` with a real `ClassificationService` (HTTP client) that uploads the intact file as multipart to `POST /v1/classify` and maps the response to the review model. The mock service, fixtures, and filename→sample mapping are removed.
- Render the real response: the ISG proposal (four classification values, including `secret` → "geheim") and the DSG assessment (three classifications plus the `profiling` / `high_risk_profiling` detection status), with `reasons` and `legal_basis` shown as text and the DSG `findings` listed as type + count.
- **Drop the simulated-only features** that the backend deliberately does not provide: ISG/DSG confidence and the confidence distribution, the low-confidence hint, evidence quotes with marker letters, and the document preview ("Im Dokument anzeigen"). The DSG review becomes three tiles plus a profiling readout instead of five tiles.
- **`geheim` is shown only when the classification is `secret`**; there is no permanently-disabled tile. The rules screen updates the "geheim → never proposed" row accordingly.
- Replace the fake four-stage analysis pipeline with a single "analysing" busy state; cancellation aborts the in-flight request.
- Flip the result labelling from "simulated" to "real proposal, no legal effect, subject to specialist review".
- Align the frontend upload size limit with the service's 10 MB default.
- Serve production classify calls same-origin: add an nginx `/v1` reverse-proxy to the Classify Service (or set the production base URL), so the Docker deployment works end to end.
- Send the current UI language as `Accept-Language` so `reasons` return translated.

## Capabilities

### New Capabilities

- (none — this changes the existing end-user surface, not a new system behavior)

### Modified Capabilities

- `classify-ui`: the end-user surface switches from the simulated demo workbench to real classification. Requirement changes: re-add the multipart upload contract and per-environment base URL; the ISG review gains `geheim` as a real (conditionally shown) proposal and loses the never-proposed claim; the DSG review collapses from five tiles to three plus a profiling readout; the confidence/justification and evidence-traceability requirements are removed (no backend source); the "simulated" labelling becomes "real proposal, no legal effect"; the busy state becomes a single pending indication with request cancellation.

## Impact

- **Code:** `classify-ui/src/app` — new `classification` service (HTTP client + response mapping) replacing `mock/`; `work` components simplified (review cards drop confidence/evidence, DSG tiles + profiling readout, busy state, intake size limit); `rules` copy for `geheim`; i18n bundles (`de/fr/it.json`) updated for the changed chrome and the "real proposal" labelling; `nginx.conf` gains the `/v1` proxy; environment files keep their base URL.
- **Backend (`classify-service`):** untouched — the UI adapts to the existing `POST /v1/classify` contract.
- **Infrastructure:** Docker Compose unchanged; production classify traffic is proxied by nginx to `classify-service:8000`.
- **Data:** no persistence; document state stays in component memory.
- **Tests:** `mock-classification.spec.ts` removed; new tests for the HTTP service (mocked `HttpClient`) and updated component tests for the simplified review, DSG profiling readout, and conditional `geheim`.
