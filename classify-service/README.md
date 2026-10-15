# Document Classify Service

Minimal API-first scaffold for the KOBY document-classification service.

The current implementation provides:

- a health endpoint;
- a synchronous classification endpoint backed by the configured KOBY LLM.

It does not yet perform document extraction, chunking, persistence or metadata updates.

## Requirements

- Python 3.12 or 3.13
- `uv`

## Run locally

```bash
cp .env.example .env
uv sync
uv run uvicorn koby_classify.main:app --reload
```

Configure `KOBY_LLM_URL` as either the model's `/v1` base URL or its complete
`/chat/completions` endpoint, and set `KOBY_API_KEY`.
Bearer authentication is used by default. Set `KOBY_API_KEY_HEADER=api-key` if the gateway
expects the key in an `api-key` header. Set `KOBY_MODEL` only if the gateway requires a model
name in the request body. The client uses the operating system trust store for TLS. If the
internal certificate authority is distributed as a PEM file instead, set `KOBY_CA_BUNDLE` to
its absolute path. TLS verification remains enabled by default. For local testing against a
known internal endpoint with a non-standard certificate, `KOBY_VERIFY_TLS=false` is available;
do not use that setting in production.

The API is then available at `http://127.0.0.1:8000` and the OpenAPI UI at `http://127.0.0.1:8000/docs`.

## Example

Create a placeholder classification:

```bash
curl -X POST http://127.0.0.1:8000/v1/classify \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Example document text",
    "source": "manual"
  }'
```

## Project structure

```text
koby_classify/
├── api/              HTTP routes and dependency wiring
├── classification/   Classification models and application service
├── config.py         Environment-based configuration
└── main.py           FastAPI application factory
```

