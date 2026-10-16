# Tasks

## 1. Connector seam (behaviour-neutral refactor)

- [x] 1.1 Create `adapters/base.py` with runtime-checkable `AssessConnector` Protocol (`assess(...)` matching the current KOBY signature plus `session_id: str | None`) and `ConnectorError` base exception. Verify: module imports, no other behaviour change, existing suite green.
- [x] 1.2 Make `KobyClientError` subclass `ConnectorError`; make `KobyClient` formaly conform to `AssessConnector` (static check via `isinstance` in a unit test). Verify: `isinstance(KobyClient(...), AssessConnector)` test passes.
- [x] 1.3 Extract prompt assembly from `KobyClient.assess` into shared `adapters/prompts.py` (`build_assessment_request(...) -> dict` producing the identical chat-completions payload minus model/transport specifics). Verify: golden-payload snapshot test of `KobyClient.assess` (mock token+HTTP) shows exactly the same body/headers as before the refactor.
- [x] 1.4 Widen `ClassificationService` to accept `AssessConnector` and catch `ConnectorError`; `dependencies.py` still passes `KobyClient`. Verify: existing classification tests pass unmodified except import updates.

## 2. OpenCode Go client

- [x] 2.1 Implement `adapters/opencode_go.py`: `OpenCodeGoClient(OpenCodeGoError)` using `build_assessment_request`, bearer auth, URL `<base>/chat/completions`, headers `User-Agent: koby-classify/<version>` and `x-opencode-session`, `httpx` default TLS, shared timeout, same response shape/empty checks and error mapping (HTTP status / timeout / connect / unexpected shape). Verify: unit tests with `resxpatch`-style mocked transport covering success, non-2xx, missing key, empty content, timeout.
- [x] 2.2 Test session semantics: consecutive `assess` calls with the same `session_id` send the same header value; the header is present on every request. Verify: unit test asserts header per request.
- [x] 2.3 Test model handling: configured model id is sent in each payload; default is `glm-5.3-flash` when none configured. Verify: unit test on request body.

## 3. Configuration and DI

- [x] 3.1 Add settings to `config.py`: `llm_provider: Literal["koby","opencode"] = "koby"`, `opencode_api_key: SecretStr | None`, `opencode_model: str | None` (default `glm-5.3-flash` applied at client construction), `opencode_base_url` (default endpoint), `opencode_timeout_seconds`. Verify: settings unit tests for env aliases and defaults.
- [x] 3.2 Extend `dependencies.py` to instantiate the provider selected by settings; raise a configuration error naming the missing setting when `opencode` lacks API key or when the provider value is invalid. Verify: unit tests for both provider paths and both failure modes.
- [x] 3.3 Ensure `ClassificationService` generates one UUID session id per `classify()` run and passes it to every `assess` (chunks, ISG+DSG, validation retries). Verify: integration-style test with a fake connector capturing the session ids for a multi-chunk classified document — all equal, consecutive runs differ.

## 4. Docs and integration check

- [x] 4.1 Document the provider switch and required env vars (`LLM_PROVIDER`, `OPENCODE_API_KEY`, `OPENCODE_MODEL`, ...) in the service README and add example env entries to `docker-compose.yml` (Koby remains default, no compose default flip). Verify: documented env names match `config.py` exactly.
- [x] 4.2 Note privacy guidance in the README: default model `glm-5.3-flash` (no training, 0-day retention); operators must not switch to prompt-training models (Gemini Argon, Muse Spark) for compliance documents. Verify: README section present.
- [x] 4.3 Full-verify integration: run the API locally with `LLM_PROVIDER=opencode` and a real `OPENCODE_API_KEY`, classify a document, observe a successful classified response; repeat with `LLM_PROVIDER=koby` to confirm unchanged KOBY behaviour. Verify: both classify calls succeed and responses follow the existing contract.
- [x] 4.4 Run full test suite and lint in `classify-service` (`uv run pytest`, lint command of the project). Verify: all green.
