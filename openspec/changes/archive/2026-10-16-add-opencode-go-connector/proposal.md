# Proposal

## Why

The classify service currently has exactly one LLM backend (`KobyClient`, the KOBY endpoint with OAuth2 client-credentials auth). There is no alternative engine, no seam to add one, and no way to run classification without KOBY credentials. OpenCode Go offers tunnelfree, OpenAI-compatible access to a curated model lineup (e.g. `glm-5.3-flash`, 0-day retention / no prompt training) via a plain bearer API key, which makes it a suitable additional runtime option — especially for local development and as a relieved engine when KOBY is unavailable.

## What Changes

- Introduce a small connector seam (`AssessConnector` protocol) that decouples `ClassificationService` from the concrete `KobyClient` type.
- Add a new `OpenCodeGoClient` adapter speaking to `https://opencode.ai/inference/go/openai/v1/chat/completions` with static bearer-key auth and an `x-opencode-session` header (one stable session id per classification run).
- Add a config switch (`KOBY_CLASSIFY_LLM_PROVIDER`, values `koby` (default) / `opencode`) plus OpenCode-specific settings (API key, model, timeout).
- Wire provider selection into FastAPI DI so that exactly one connector is instantiated per process.
- No change to the `assess()` behaviour contract: same prompt assembly, JSON-with-retry handling, and aggregation remain in the service; the Go connector reuses the shared prompt-instruction building blocks.
- Existing KOBY configuration and behaviour remain valid and unchanged; KOBY stays the default provider.

## Capabilities

### New Capabilities
- `llm-connectors`: The classify service's pluggable LLM provider mechanism — provider selection via configuration, the shared assessment contract both connectors must satisfy (`assess(...)` returning the raw LLM JSON string), and the observable behaviour of the OpenCode Go provider (auth, endpoint, session header, model selection, error surfacing).

### Modified Capabilities
<!-- none: classify-ui requirements are UI/presentation-level and simulated-data-pinned; the backend connector does not change any of them. -->

## Impact

- `classify-service/koby_classify/adapters/`: new `opencode_go.py` module; shared connector protocol (likely `base.py`); `KobyClient` unchanged in behaviour (optionally conforms to protocol).
- `classify-service/koby_classify/classification/service.py`: constructor parameter type widens from `KobyClient` to the connector protocol; prompt-instruction code factored into shared helpers for reuse by both adapters.
- `classify-service/koby_classify/api/dependencies.py`: builds the connector selected by settings.
- `classify-service/koby_classify/config.py`: new settings fields (`llm_provider`, `opencode_api_key`, `opencode_model`, `opencode_base_url`, timeout).
- `docker-compose.yml` / service docs: document the provider switch and required env vars.
- External dependency: OpenCode Go API endpoint + convention headers (`User-Agent: koby-classify/...`, `x-opencode-session`); no new Python packages beyond existing `httpx`/`truststore`.
