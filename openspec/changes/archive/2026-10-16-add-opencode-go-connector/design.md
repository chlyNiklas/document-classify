# Design

## Context

`ClassificationService` currently holds a concrete `KobyClient` (`classification/service.py:57`). `KobyClient` (`adapters/koby.py`) does prompt assembly inline, OAuth2 client-credentials token refresh, truststore TLS, and one `POST {url}/chat/completions`. `api/dependencies.py` constructs the singleton at import. OpenCode Go exposes the same wire format (`POST https://opencode.ai/inference/go/openai/v1/chat/completions`) with static bearer auth plus `User-Agent` and `x-opencode-session` conventions. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- A minimal connector seam: a structural protocol both clients satisfy, no ABC ceremony.
- Reuse of the prompt-instruction assembly (correction / language / part / assessment blocks) currently inlined in `KobyClient.assess`, so both providers send identical user prompts.
- Config-driven provider selection, KOBY remains the default.

**Non-Goals:**
- No fallback or multi-provider failover; exactly one connector per process.
- No `response_format`/JSON-mode experimentation; prompt + validation-retry stays as is.
- No usage/billing instrumentation of the OpenCode subscription.
- No change to the KOBY client's external behaviour.

## Decisions

**1. Protocol, not ABC / factory classes.** Define `AssessConnector` (runtime-checkable `typing.Protocol` with `assess(...) -> str` plus a provider-specific error type base, see decision 3) in `adapters/base.py`. `ClassificationService.__init__` accepts the protocol; `adapters/__init__.py` stays re-export-only. Alternative: a `ClientBase`-style ABC — rejected because `KobyClient` already duck-types the seam and a Protocol keeps the service's own tests free of inheritance constraints.

**2. Prompt assembly moves to a shared module, protocol methods stay the seam.** Extract the instruction builders from `KobyClient.assess` (correction, language_instruction, part_instruction, assessment_instruction, payload construction) into `adapters/prompts.py` (e.g. `build_assessment_request(text, *, assessment, system_prompt, ...) -> dict payload/messages`). Both `KobyClient` and `OpenCodeGoClient` call it, then only differ in transport details (auth, headers, URL, error mapping). This is the main refactor; it must be behaviour-neutral for KOBY (same payload bytes).

**3. Error type.** Introduce `ConnectorError` (base) in `adapters/base.py`; make `KobyClientError` subclass it and add `OpenCodeGoError`. `ClassificationService` currently catches `KobyClientError` — widen to `ConnectorError`. Alternative: reuse a single error class with a provider string — rejected; tests and the health/mapping path already key off the exception class.

**4. OpenCode transport.** New `adapters/opencode_go.py`:
- URL: base `https://opencode.ai/inference/go/openai/v1` → `/chat/completions` (config `opencode_base_url`, overridable for tests).
- Auth: static `Authorization: Bearer <api_key>`; config `opencode_api_key` (SecretStr, env alias `OPENCODE_API_KEY`).
- Headers: `User-Agent: koby-classify/<version>` (import from package metadata or constant), `x-opencode-session: <uuid4>`.
- Session id: generated per `classify()` call and passed to each `assess()` in that run — `assess` gains a required-by-connector `session_id: str` parameter (KOBY ignores it). The service generates one UUID per `classify()` invocation.
- TLS: plain `httpx` defaults; no truststore dependency needed for this endpoint (no corporate CA). `httpx.Timeout` from shared `timeout_seconds`.
- Response parsing identical shape-checks to KOBY (`choices[0].message.content`).
- Rationale: minimises divergence from the proven KOBY code path while accounting for the Go platform's traffic conventions (validated clients doc).

**5. Config and DI.** `config.py`: `llm_provider: Literal["koby","opencode"] = "koby"` (env `LLM_PROVIDER`), `opencode_api_key`, `opencode_model` (default `glm-5.3-flash`), `opencode_base_url`, `opencode_timeout_seconds` (falls back to shared `timeout_seconds` default 120). `dependencies.py` builds KobyClient or OpenCodeGoClient per settings, validating required inputs up front with a clear error. Model timeout uses the KOBY-style variable names only where shared (`timeout_seconds` unchanged keeps current env names working).

**6. Validation-retry loop unchanged.** The service's one JSON-retry stays in `ClassificationService`; it passes the same `session_id` through so retries stay within one session — consistent with the stability guarantee of OpenCode's prompt-cache routing.

## Risks / Trade-offs

- [OpenCode Go is a coding-agent product; batch classification usage sits outside its "validated clients" list] → Mitigation: adopt their own published conventions exactly (custom User-Agent, stable `x-opencode-session`); keep provider switchable so a degraded OpenCode experience never blocks KOBY.
- [Prompt-cache-routing benefits assume a stable session prefix; parallel ISG+DSG sends diverge immediately] → Mitigation: session per run is still the closest legal unit; no further optimisation requested by specs.
- [Privacy varies by model (Gemini Argon / Muse Spark train on prompts)] → Mitigation: default `glm-5.3-flash` (0-day retention, no training); document that operators MUST keep the model on privacy-safe list for compliance documents;Регelwerk model/operations card wording untouched.
- [Subscription usage budgets (5h/weekly/monthly) can rate-limit bursts of documents] → Mitigation: KOBY remains the default provider; OpenCode errors surface as provider errors handled like today's KOBY errors — a 429 is retried nothing special, human reads it.
- [Refactor of `KobyClient.assess` risks subtle payload drift] → Mitigation: shared `build_assessment_request` extracted first, KOBY tested against golden payload snapshots before the OpenCode client is added.

## Migration Plan

1. Land the connector seam + prompt extraction (no config flip; behaviour identical).
2. Add OpenCode client, settings, DI switch behind the new env var (default `koby`).
3. Local integration test with a real `OPENCODE_API_KEY` (`LLM_PROVIDER=opencode`).
4. Rollback = unset `LLM_PROVIDER` (or set `koby`); no data migrations involved.

## Open Questions

- None blocking. (Concrete `User-Agent` version string source — package metadata vs. constant — is a task-level detail.)
