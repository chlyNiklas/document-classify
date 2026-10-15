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

The token and model request timeout defaults to 120 seconds and can be changed with
`KOBY_TIMEOUT_SECONDS`. Timeout, connection, protocol, and HTTP status failures are reported
separately without exposing credentials or response contents.

The service loads the compact `REGELWERK_ISG_KLASSIFIZIERUNG.md` and
`REGELWERK_DSG_KLASSIFIZIERUNG.md` policy packs from the repository root at startup. It sends both
to KOBY in one request and validates the two assessments independently. Deployments that store the
files elsewhere can set `KOBY_ISG_RULEBOOK_PATH` and `KOBY_DSG_RULEBOOK_PATH` to absolute paths.
Startup fails if either policy pack cannot be loaded.

Before the KOBY call, the service also detects formally valid AHV numbers and passes only a masked,
structured finding to the model. The deterministic finding is merged into the validated DSG result,
so an omitted AHV finding cannot result in `keine personendaten`.

If KOBY returns malformed JSON or violates the nested schema, the service sends one corrective
request containing only the validation messages, never the invalid output. A second invalid response
is returned as HTTP 502 with the schema locations that still failed and is logged without document
content.

The API is then available at `http://127.0.0.1:8000` and the OpenAPI UI at `http://127.0.0.1:8000/docs`.

## CORS

The API enables CORS so browser front-ends can call it directly. The allowed origins are
configured via `KOBY_CLASSIFY_cors_origins` (a comma-separated list of origins). The
default is `http://localhost:4200`, the Angular dev server. Only `GET` and `POST`
requests are allowed, without credentials.

## Example

Classify a document:

```bash
curl -X POST http://127.0.0.1:8000/v1/classify \
  -F 'file=@/absolute/path/to/document.pdf'
```

The response contains independent ISG/ISV and DSG assessments:

```json
{
  "isg_isv": {
    "classification": "nicht klassifiziert",
    "reasons": [
      "Kein konkretes Schadensszenario nach Art. 18–20 ISV ist erkennbar."
    ],
    "legal_basis": [
      "Art. 18–20 ISV"
    ]
  },
  "dsg": {
    "classification": "personendaten",
    "reasons": [
      "Das Dokument enthält eine formal gültige AHV-Nummer."
    ],
    "legal_basis": [
      "Art. 5 Bst. a DSG"
    ],
    "findings": [
      {
        "type": "ahv_number",
        "category": "personendaten",
        "count": 1
      }
    ],
    "profiling": "nicht erkannt",
    "high_risk_profiling": "nicht erkannt"
  }
}
```

Every response is a recommendation and always requires review by the responsible legal or subject
matter specialist. Uncertainty and missing context are reported in `reasons`; there is therefore no
per-result `review_required` flag.

The upload limit defaults to 10 MiB and extracted text is limited to 100,000 characters. These
limits can be changed with `KOBY_CLASSIFY_MAX_UPLOAD_BYTES` and
`KOBY_CLASSIFY_MAX_EXTRACTED_CHARACTERS`. PDFs must contain a text layer; scanned PDFs require OCR,
which is not implemented yet.

## Project structure

```text
koby_classify/
├── api/              HTTP routes and dependency wiring
├── classification/   ISG/ISV and DSG models, detectors, rules, and service
├── extraction/       PDF, DOCX, and plain-text extraction
├── config.py         Environment-based configuration
└── main.py           FastAPI application factory
```

