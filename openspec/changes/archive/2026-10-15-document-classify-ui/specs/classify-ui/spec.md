# Spec Delta

## Purpose

Defines the end-user surface of the Classify UI: submitting a Document to the Classify Service and showing the Classification verbatim. It pins the upload contract, the honesty rules (nothing hidden or re-worded), trilingual support, and the local Docker delivery as an agreed baseline before real classifications replace the placeholder service behavior.

## ADDED Requirements

### Requirement: Single-feature entry point
The Classify UI SHALL present document classification as the primary activity on its home route; no other end-user features are offered.

#### Scenario: Opening the app
- **WHEN** an end user opens the Classify UI at its served address
- **THEN** the home page shows the document classification surface (drop zone) as the main content

### Requirement: Document drop zone accepts exactly the supported formats
The Classify UI SHALL let the end user drag-and-drop or select exactly one Document accepted by the Classify Service (PDF, Word, plaintext file), and SHALL not accept a second Document in the same state.

#### Scenario: Dropping a supported file
- **WHEN** the end user drops a single `.pdf`, `.docx`, or `.txt` file
- **THEN** the UI takes the file as the Document to classify

#### Scenario: Dropping multiple files
- **WHEN** the end user drops more than one file at once
- **THEN** at most one Document is accepted and the surplus is reported as ignored by the UI

### Requirement: No client-side text extraction
The Classify UI SHALL submit the Document file as-is; it MUST NOT extract or transform its text in the browser.

#### Scenario: Submitting a Document
- **WHEN** the end user provides a Document for classification
- **THEN** the UI sends the intact file, not derived text

### Requirement: Upload multipart contract
The Classify UI SHALL upload the Document to `POST /v1/classify/document` as a multipart request with the file in a single field named `file`.

#### Scenario: Successful upload request
- **WHEN** the end user has provided a Document
- **THEN** the UI issues one multipart POST with field `file` to `/v1/classify/document` and waits for the Classification

### Requirement: Classification shown verbatim
On a successful response, the Classify UI SHALL display the response body verbatim and MUST NOT interpret, score, re-wrap, or reword the Classification.

#### Scenario: A classification response arrives
- **WHEN** `POST /v1/classify/document` responds with 200
- **THEN** the UI shows the exact response body in a result area

### Requirement: Failures shown raw
On any upload failure (service unavailable, endpoint unimplemented, or validation error), the Classify UI SHALL display the HTTP status and response body verbatim and MUST NOT substitute a friendlier message or hide the technical detail.

#### Scenario: Classification endpoint not yet implemented
- **WHEN** `POST /v1/classify/document` responds with 404 Not Found
- **THEN** the UI shows status 404 together with the exact response body

#### Scenario: Service unreachable
- **WHEN** the HTTP request to the Classify Service fails without a response
- **THEN** the UI shows the failure honestly instead of silently dropping it

### Requirement: Pending state visible while classifying
The Classify UI SHALL indicate that classification is in progress between submitting the Document and receiving the Classification.

#### Scenario: Waiting for the result
- **WHEN** the Document has been submitted and no response has arrived yet
- **THEN** the UI shows a pending indication until the Classification or failure is displayed

### Requirement: Trilingual UI with German default
The Classify UI SHALL be available in German (de-CH, default), French (fr-CH), and Italian (it-CH), with all user-facing text of the classification surface translated.

#### Scenario: German default
- **WHEN** the end user opens the Classify UI without a prior language choice
- **THEN** the interface text is German

#### Scenario: Choosing French or Italian
- **WHEN** the end user switches the language to fr-CH or it-CH
- **THEN** all user-facing text of the Classify UI renders in the selected language

### Requirement: API base URL by environment
The Classify UI SHALL call the Classify Service through a configurable base URL: the development environment targets `http://localhost:8000` and the production build calls the Classify Service on the same origin it is served from.

#### Scenario: Development usage
- **WHEN** the Classify UI runs on the local dev server against a locally running Classify Service
- **THEN** requests go to `http://localhost:8000`

#### Scenario: Production usage
- **WHEN** the production build of the Classify UI is served
- **THEN** classify requests are issued relative to the serving origin

### Requirement: Docker delivery of the Classify UI
The root Docker Compose SHALL deliver the Classify UI as a static web app served on port 4200 with single-page-application routing fallback, next to the Classify Service on port 8000.

#### Scenario: Bringing the stack up
- **WHEN** `docker compose up --build -d` is run at the repository root
- **THEN** the Classify UI is reachable at `http://localhost:4200` (deep links return the app shell) and the Classify Service at `http://localhost:8000`

#### Scenario: Rebuilding the stack
- **WHEN** the Classify UI source changes and the Compose images are rebuilt
- **THEN** the served app embeds the production configuration (same-origin classify calls)
