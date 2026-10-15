# Document Classify Service

Minimal API-first scaffold for the KOBY document-classification service.

The current implementation provides:

- a health endpoint;
- a synchronous classification endpoint backed by the configured KOBY LLM;
- text extraction for PDF, DOCX, and UTF-8 plain-text uploads.

It does not yet perform OCR, persistence or metadata updates.

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

The service requests `low` model reasoning effort by default because classification uses explicit
rules and a constrained schema. Configure `KOBY_REASONING_EFFORT` as `low`, `medium`, or `high`
if the selected KOBY model supports a different tradeoff.

The service loads the compact `REGELWERK_ISG_KLASSIFIZIERUNG.md` and
`REGELWERK_DSG_KLASSIFIZIERUNG.md` policy packs from the repository root at startup. It sends two
concurrent KOBY requests: one with only the ISG/ISV rules and one with only the DSG rules. The
service validates and, when necessary, retries each assessment independently before combining them
into one response. Deployments that store the files elsewhere can set `KOBY_ISG_RULEBOOK_PATH` and
`KOBY_DSG_RULEBOOK_PATH` to absolute paths. Startup fails if either policy pack cannot be loaded.

Before the KOBY call, the service also detects formally valid AHV numbers and passes only a masked,
structured finding to the model. The deterministic finding is merged into the validated DSG result,
so an omitted AHV finding cannot result in `keine personendaten`.

Documents longer than 50,000 extracted characters are split on paragraph, line, sentence, or word
boundaries. Each policy pipeline processes its chunks sequentially, while the ISG/ISV and DSG
pipelines run in parallel, keeping at most two KOBY requests active. The service conservatively
aggregates the highest classification and detection levels, deduplicates reasons and legal bases,
and sums DSG findings across non-overlapping chunks. Configure the threshold with
`KOBY_CLASSIFY_CLASSIFICATION_CHUNK_CHARACTERS`.

If either KOBY response contains malformed JSON or violates its schema, only that assessment gets
one corrective request containing the validation messages, never the invalid output. A second
invalid response is returned as HTTP 502 with the schema locations that still failed and is logged
without document content.

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
  -H 'Accept-Language: de' \
  -F 'file=@/absolute/path/to/document.pdf'
```

`Accept-Language` controls the language of the human-readable `reasons`. Supported languages are
German (`de`), French (`fr`), and Italian (`it`); German is used when the header is absent or no
supported language is requested. Regional and weighted values such as `fr-CH, de;q=0.8` are
supported. Classification, finding-category, and detection-status values remain stable canonical
API values and are not translated. The selected language is also returned in the
`Content-Language` response header.

The response contains independent ISG/ISV and DSG assessments:

```json
{
  "isg_isv": {
    "classification": "unclassified",
    "reasons": [
      "Kein konkretes Schadensszenario nach Art. 18–20 ISV ist erkennbar."
    ],
    "legal_basis": [
      "Art. 18–20 ISV"
    ]
  },
  "dsg": {
    "classification": "personal_data",
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

