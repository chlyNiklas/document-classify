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

## Inbound API authentication

The classification endpoint can validate OAuth 2.0 bearer access tokens issued by an OIDC provider.
This is separate from `KOBY_CLIENT_ID` and `KOBY_CLIENT_SECRET`, which the service uses for its
outbound calls to the KOBY model gateway.

Authentication is off by default for local development. Enable it in a deployed environment with:

```dotenv
KOBY_CLASSIFY_AUTH_ENABLED=true
KOBY_CLASSIFY_AUTH_ISSUER=https://identity.example/realms/classify
KOBY_CLASSIFY_AUTH_AUDIENCE=classify-api
KOBY_CLASSIFY_AUTH_JWKS_URL=https://identity.example/realms/classify/protocol/openid-connect/certs
KOBY_CLASSIFY_AUTH_ALGORITHMS=RS256
KOBY_CLASSIFY_AUTH_REQUIRED_SCOPE=document:classify
```

When enabled, `POST /v1/classify` requires a signed access token with the configured issuer,
audience, and scope. The service caches signing keys and refreshes them on rotation. `GET /health`
stays public so orchestration platforms can probe the service. The API never accepts browser client
secrets.

Register two clients at the identity provider:

- A public browser client for the Angular UI, using Authorization Code flow with PKCE and an exact
  redirect URI matching the UI origin.
- A confidential service client for other applications. Those applications should use the Client
  Credentials flow to obtain a token for the API audience and `document:classify` scope.

PKCE protects an interactive public client; it is not an authentication flow for unattended
machine clients. The API treats both token types the same after issuance and validates each token
independently.

For provider compatibility, permissions are read from the standard `scope` or `scp` claim and from
application `roles`. Machine tokens may identify the caller through `client_id`, `azp`, or `appid`
when there is no user subject.

## CORS

The API enables CORS so browser front-ends can call it directly. The allowed origins are
configured via `KOBY_CLASSIFY_cors_origins` (a comma-separated list of origins). The
default is `http://localhost:4200`, the Angular dev server. Only `GET` and `POST`
requests are allowed, without credentials.

## Example

Classify a document:

```bash
curl -X POST http://127.0.0.1:8000/v1/classify \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
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

## Evaluate the classifier

With the API running, evaluate every discovered `GT-*.yaml` case and write a JSON report:

```bash
export KOBY_CLASSIFY_EVALUATION_TOKEN="$ACCESS_TOKEN"
uv run python -m koby_classify.evaluation \
  --dataset ../ground_truth \
  --output ../evaluation-results/latest.json
```

`KOBY_CLASSIFY_EVALUATION_TOKEN` is optional when API authentication is disabled. Its value is sent
as a bearer token but is never written to the evaluation report.

The evaluator exercises the public multipart HTTP endpoint, validates every successful response
against the API schema, retains each raw prediction, and reports latency, failures, prediction
distributions, accuracy, macro-F1, and over- versus under-classification. It discovers annotations
directly so that cases missing from `manifest.yaml` are still evaluated, while reporting manifest
and checksum inconsistencies.

Only explicit `information_security.expected_classification` values are scored. Earlier
`isv_expected_classification_proposal` values marked as non-ground-truth are reported but excluded
from metrics. The current corpus has no scoreable DSG labels, so DSG prediction distributions are
reported without an accuracy claim.

Inspect dataset integrity and label coverage without calling the API:

```bash
uv run python -m koby_classify.evaluation --dataset ../ground_truth --validate-only
```

Use `--case GT-0101` (repeatable) or `--limit 5` for a smaller run. The defaults are two concurrent
requests, German response reasons, a 180-second per-request timeout, and
`http://127.0.0.1:8000/v1/classify` as the endpoint.

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

