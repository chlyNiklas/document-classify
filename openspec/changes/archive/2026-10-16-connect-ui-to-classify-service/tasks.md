# Tasks

## 1. Real classification service and response mapping

- [x] 1.1 Create `ClassificationService` (HTTP client) that POSTs the intact file as multipart (`file` field) to `${environment.apiBaseUrl}/v1/classify`, sends `Accept-Language` from the active language, maps the `{ isg_isv, dsg }` response into the review model, and exposes the same `documents`/`selectedId`/`rejections` signals plus `validate`/`addFiles`/`cancel`/`select` as the mock did; verify a unit test with a mocked `HttpClient` maps a fixture response into the review model
- [x] 1.2 Add the `failed` document status and error mapping (no response → service unavailable; 413/415/422/502 → translated reasons); verify a unit test covers each error path marking the document failed with the correct reason
- [x] 1.3 Point the work components at `ClassificationService`, delete `mock/` (`demo-samples.ts`, `mock-documents.ts`, `mock-classification.service.ts` + spec), and remove the fixture-only fields (`sampleId`, `tag`, `pages`, `step`); verify `npm run build` succeeds and no `mock/` import remains

## 2. Review cards (simplified to the real response)

- [x] 2.1 Rework the ISG card: four classification tiles with `geheim` rendered only when the classification is `secret`, the proposal marked, confidence/distribution and the low-confidence hint removed, and the reasons list + legal basis shown; verify unit tests cover the conditional `geheim` tile, proposal marking, and reasons/legal-basis rendering
- [x] 2.2 Rework the DSG card: three classification tiles plus a profiling readout (`profiling`, `high_risk_profiling`) and the findings list (category + count); verify unit tests cover proposal marking, the profiling readout and findings rendering
- [x] 2.3 Remove the evidence accordion and the document preview (`work-evidence`, `demo-doc-preview`, the preview presenter helpers) and the "Im Dokument anzeigen" actions; verify the build passes with no remaining evidence/preview references
- [x] 2.4 Update the "Befund als JSON" panel to show the real classification response (keeping the copy action and success notification); verify a unit test covers the JSON content matching the mapped response

## 3. Intake, busy and failure states

- [x] 3.1 Restrict the drop zone accept list to `pdf`, `docx`, `md`, `txt` and the size limit to 10 MB; verify unit tests cover accept/reject for the four formats and the 10 MB boundary
- [x] 3.2 Replace the four-stage pipeline with a single pending indication, and make cancel abort the in-flight request via the per-document `AbortController`; verify unit tests cover the pending render and that cancel aborts and removes the document
- [x] 3.3 Render failed documents with a visible reason and a remove action while leaving other documents untouched; verify a unit test covers a failed document showing its reason without affecting others

## 4. Rules screen and guidance

- [x] 4.1 Update the rules screen copy: the ISG table marks `geheim` as proposed only on escalation with an Art. 24 ISV reference, the DSG definitions include the profiling detection status, and the principles card covers justification, legal basis and findings (no confidence/evidence); verify the rules unit tests cover the updated `geheim` row and principles content
- [x] 4.2 Update the guidance ("Hinweise zur Prüfung") points and the results-area/header labelling to "proposal, no legal effect, subject to BIT review" (drop the "simulated" wording); verify unit tests cover the guidance panel text and the results-area note

## 5. i18n, production wiring, integration

- [x] 5.1 Extend `i18n/{de,fr,it}.json` for the changed chrome, DSG/profiling/findings labels, error reasons and the "real proposal" labelling; verify the app renders German by default and the language switch updates the labels
- [x] 5.2 Add the nginx `location /v1/ { proxy_pass http://classify-service:8000; }` block and keep production `apiBaseUrl` empty (same-origin); verify `docker compose up --build` serves the UI on port 4200 and a classify request reaches the service
- [x] 5.3 Run the full vitest suite and the production build; fix failures and verify every spec passes and `npm run build` succeeds
