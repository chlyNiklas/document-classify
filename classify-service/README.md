# Document Classify Service

Minimal API-first scaffold for the KOBY document-classification service.

The current implementation provides:

- a health endpoint;
- a synchronous placeholder classification endpoint.

It does not yet perform document extraction, chunking, model inference, persistence or metadata updates.

## Requirements

- Python 3.12 or 3.13
- `uv`

## Run locally

```bash
cp .env.example .env
uv sync
uv run uvicorn koby_classify.main:app --reload
```

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

