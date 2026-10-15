# Document Classify Service

Minimal API-first scaffold for the KOBY document-classification service.

The current implementation provides:

- a health endpoint;
- a synchronous classification endpoint backed by the configured KOBY LLM;
- text extraction for PDF, DOCX, and UTF-8 plain-text uploads.

It does not yet perform OCR, chunking, persistence or metadata updates.

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
`/chat/completions` endpoint. Set `KOBY_CLIENT_ID` and `KOBY_CLIENT_SECRET` to the OAuth client
credentials issued by KOBY. The service obtains an access token from `KOBY_TOKEN_URL`, caches it
until shortly before expiry, and sends it to the model endpoint as a bearer token. For compatibility,
`KOBY_API_KEY` is also accepted as an alias for `KOBY_CLIENT_SECRET`.

Set `KOBY_MODEL` only if the gateway requires a model name in the request body. The client uses the
operating system trust store for TLS. If the internal certificate authority is distributed as a PEM
file instead, set `KOBY_CA_BUNDLE` to its absolute path. TLS verification remains enabled by default.
For local testing against a known internal endpoint with a non-standard certificate,
`KOBY_VERIFY_TLS=false` is available; do not use that setting in production.

The API is then available at `http://127.0.0.1:8000` and the OpenAPI UI at `http://127.0.0.1:8000/docs`.

## Example

Classify a document:

```bash
curl -X POST http://127.0.0.1:8000/v1/classify \
  -F 'file=@/absolute/path/to/document.pdf'
```

The upload limit defaults to 10 MiB and extracted text is limited to 100,000 characters. These
limits can be changed with `KOBY_CLASSIFY_MAX_UPLOAD_BYTES` and
`KOBY_CLASSIFY_MAX_EXTRACTED_CHARACTERS`. PDFs must contain a text layer; scanned PDFs require OCR,
which is not implemented yet.

## Project structure

```text
koby_classify/
├── api/              HTTP routes and dependency wiring
├── classification/   Classification models and application service
├── extraction/       PDF, DOCX, and plain-text extraction
├── config.py         Environment-based configuration
└── main.py           FastAPI application factory
```

