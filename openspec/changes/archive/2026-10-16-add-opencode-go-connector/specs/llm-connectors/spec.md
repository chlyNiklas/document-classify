# Spec Delta

## Purpose

Defines the classify service's pluggable LLM provider mechanism: the service SHALL select its classification engine (connector) through configuration, all connectors SHALL fulfil the same assessment contract used by the classification pipeline, and the OpenCode Go provider SHALL be selectable alongside the existing KOBY provider.

## ADDED Requirements

### Requirement: Provider selection via configuration
The classify service SHALL select its LLM connector through configuration. Supported provider values SHALL be `koby` (default) and `opencode`. When the selected provider is misconfigured (missing required credentials, unknown provider value), the service SHALL fail with a configuration error naming the provider and the missing setting.

#### Scenario: OpenCode provider selected
- **WHEN** the provider setting is `opencode` and the OpenCode API key and model are configured
- **THEN** the classification pipeline uses the OpenCode Go endpoint for its LLM assessments

#### Scenario: Unknown provider value
- **WHEN** the provider setting holds a value other than `koby` or `opencode`
- **THEN** the service fails to start with an error naming the invalid value and the valid options

#### Scenario: Default remains KOBY
- **WHEN** no provider setting is present and KOBY credentials are configured
- **THEN** classification behaves exactly as before this capability existed (KOBY engine)

### Requirement: OpenCode Go assessment call
The OpenCode provider SHALL perform a chat completion against the OpenCode Go OpenAI-compatible endpoint using a bearer API key, sending the same user prompt content the KOBY provider assembles (system rulebook prompt, correction, language, part and assessment instructions, documented text). It SHALL return the assistant's raw text content to the classification pipeline, which continues to own JSON parsing, validation and the retry-on-validation-failure behaviour.

#### Scenario: Successful assessment
- **WHEN** an assessment request is issued with a valid API key and the endpoint returns a chat completion with non-empty content
- **THEN** the assistant message content is returned as the assessment text

#### Scenario: HTTP error from the endpoint
- **WHEN** the endpoint responds with a non-2xx status
- **THEN** the request fails with an error that includes the OpenCode provider name and the HTTP status

#### Scenario: Missing API key
- **WHEN** the OpenCode provider is selected but no API key is configured
- **THEN** the service reports a configuration error naming the required setting before any request is sent

### Requirement: OpenCode client identification and session header
The OpenCode provider SHALL send a service-specific `User-Agent` header (not a generic HTTP-library name) and SHALL send an `x-opencode-session` header carrying one session identifier per classification run: all LLM requests belonging to the same classification of the same document (all chunks, ISG and DSG assessments, and validation retries within that run) share the same session id, while different classification runs use different session ids.

#### Scenario: Session stability within a run
- **WHEN** one classification run issues multiple LLM requests (different chunks and/or ISG and DSG assessments)
- **THEN** all of these requests carry the same `x-opencode-session` value

#### Scenario: Session change between runs
- **WHEN** two separate classification runs execute
- **THEN** each run's requests carry distinct `x-opencode-session` values

### Requirement: OpenCode model configuration
The OpenCode provider SHALL send the configured model identifier in the chat completion request. When no model is configured, a built-in default of `glm-5.3-flash` SHALL be used.

#### Scenario: Configured model is sent
- **WHEN** an OpenCode model is configured and an assessment is requested
- **THEN** the request body names that model id

#### Scenario: Default model
- **WHEN** no OpenCode model is configured
- **THEN** the request body names `glm-5.3-flash`

### Requirement: Connector contract
Both the KOBY provider and the OpenCode provider SHALL expose the same assessment operation (given text, assessment kind, system prompt, and optional validation feedback, deterministic findings, language and document part, return the assistant text or raise a provider-specific error). The classification pipeline SHALL remain functional with exactly one of the two providers active; selecting a provider SHALL not require code changes.

#### Scenario: Pipeline runs against either provider
- **WHEN** the classify endpoint is called with provider `koby` and afterwards with provider `opencode`
- **THEN** the classification response contract is identical for both, independent of the selected provider

#### Scenario: Provider error surfaces in pipeline
- **WHEN** the selected provider cannot complete an assessment (network, HTTP, or timeout error)
- **THEN** the classification pipeline handles the error the same way it handles KOBY engine errors today
