# classify-ui Specification

## Purpose
Defines the end-user surface of the Classify UI: the document-review workbench (Arbeitsbereich and Regelwerk). While the classification response contract is being extended, all classification results are simulated with demo data; the workbench pins multi-document intake, the review flows for ISG and DSG proposals, findings traceability, the honesty rule that results are labelled as simulated with no legal effect, the trilingual UI, and the local Docker delivery.

## Requirements

### Requirement: Single-feature entry point
The Classify UI SHALL present document classification as the primary and only end-user feature, delivered as the document-review workbench. Its routes are `/work` (Arbeitsbereich, the default) and `/rules` (Regelwerk), reachable from the master-layout main navigation; no other end-user features are offered.

#### Scenario: Opening the app
- **WHEN** an end user opens the Classify UI at its served address
- **THEN** the default route shows the Arbeitsbereich review surface of the workbench

### Requirement: Document drop zone accepts exactly the supported formats
The Classify UI SHALL let the end user add one or more Documents by drag-and-drop or file selection. Files in the supported formats (`pdf`, `docx`, `md`, `txt`) SHALL become individual Document entries, each independently analysed. The UI SHALL reject other formats and files exceeding the size limit (10 MB) with a visible reason, without losing already added Documents.

#### Scenario: Dropping a supported file
- **WHEN** the end user drops a file in a supported format
- **THEN** the file becomes a Document entry with its own status and analysis

#### Scenario: Dropping multiple files
- **WHEN** the end user drops multiple files at once
- **THEN** every supported file becomes a Document entry, each analysed independently

#### Scenario: Dropping an unsupported file
- **WHEN** the end user drops a file in an unsupported format
- **THEN** the UI shows a rejection reason naming the format and the supported types, and already added Documents remain untouched

### Requirement: No client-side text extraction
The Classify UI SHALL submit the Document file as-is; it MUST NOT extract or transform its text in the browser.

#### Scenario: Submitting a Document
- **WHEN** the end user provides a Document for classification
- **THEN** the UI sends the intact file, not derived text

### Requirement: Pending state visible while classifying
While a Document is being analysed, the Classify UI SHALL show a visible pending indication until the classification result or a failure is shown, and SHALL allow the end user to cancel the analysis of that Document.

#### Scenario: Waiting for the result
- **WHEN** a Document analysis runs and no result has arrived yet
- **THEN** the UI displays a pending indication until the proposal result appears

#### Scenario: Cancelling an analysis
- **WHEN** the end user cancels a running analysis
- **THEN** the in-flight request is aborted and the Document is removed without a result

### Requirement: Trilingual UI with German default
The Classify UI SHALL be available in German (de-CH, default), French (fr-CH), and Italian (it-CH), with all user-facing text of the classification surface translated.

#### Scenario: German default
- **WHEN** the end user opens the Classify UI without a prior language choice
- **THEN** the interface text is German

#### Scenario: Choosing French or Italian
- **WHEN** the end user switches the language to fr-CH or it-CH
- **THEN** all user-facing text of the Classify UI renders in the selected language

### Requirement: Docker delivery of the Classify UI
The root Docker Compose SHALL deliver the Classify UI as a static web app served on port 4200 with single-page-application routing fallback, next to the Classify Service on port 8000.

#### Scenario: Bringing the stack up
- **WHEN** `docker compose up --build -d` is run at the repository root
- **THEN** the Classify UI is reachable at `http://localhost:4200` (deep links return the app shell) and the Classify Service at `http://localhost:8000`

#### Scenario: Rebuilding the stack
- **WHEN** the Classify UI source changes and the Compose images are rebuilt
- **THEN** the served app embeds the production configuration

### Requirement: Workbench navigation
The master-layout main navigation SHALL offer the items "Arbeitsbereich" (route `/work`) and "Regelwerk" (route `/rules`), and navigation SHALL switch between the two sections.

#### Scenario: Switching sections
- **WHEN** the end user activates a main-navigation item
- **THEN** the corresponding section is displayed at its route

### Requirement: ISG proposal review
The Arbeitsbereich SHALL show, for the selected Document, a review card proposing one information-security category among "nicht klassifiziert", "intern", "vertraulich" and "geheim", with the proposal tile visually marked. The review card SHALL title the information-security assessment as being made according to the ISV (gemäss ISV). The "geheim" tile SHALL be shown only when the classification is "geheim"; for every other classification it SHALL NOT be shown.

#### Scenario: Proposal shown for selected document
- **WHEN** the end user selects a Document with a completed analysis
- **THEN** the review card shows that Document's proposed ISV category and marking

#### Scenario: Geheim is never proposed
- **WHEN** the review card is displayed for a Document whose classification is not "geheim"
- **THEN** no "geheim" tile is shown and no proposal targets it

#### Scenario: Geheim shown for a geheim classification
- **WHEN** a Document's classification is "geheim"
- **THEN** the "geheim" tile is shown as the marked proposal

#### Scenario: Switching selected documents
- **WHEN** the end user selects a different Document
- **THEN** the review cards show that Document's own proposal and justification

### Requirement: DSG assessment
Each review card set SHALL include a DSG assessment with three assessment tiles — "keine Personendaten", "Personendaten", "besonders schützenswerte Personendaten" — with the proposed tile visually marked. The assessment SHALL additionally show the profiling status and the high-risk-profiling status, each reported as "nicht erkannt", "möglich" or "erkannt".

#### Scenario: DSG proposal shown
- **WHEN** a Document with a completed analysis is selected
- **THEN** the DSG assessment shows the proposed assessment tile among the three

#### Scenario: Profiling status shown
- **WHEN** a Document with a completed analysis is selected
- **THEN** the DSG assessment shows the profiling and high-risk-profiling status of that Document

### Requirement: Findings JSON access
The Arbeitsbereich SHALL offer an action opening the classification response ("Befund als JSON") in an off-canvas or dialog for the selected Document, showing the classification response as formatted JSON, and SHALL provide a copy action that confirms success by notification.

#### Scenario: Opening the findings JSON
- **WHEN** the end user activates "Befund als JSON"
- **THEN** the classification response is shown as formatted JSON

#### Scenario: Copying the findings JSON
- **WHEN** the end user activates the copy action in the JSON view
- **THEN** the JSON is copied to the clipboard and success is confirmed by notification

### Requirement: Demo result labelling
The Classify UI SHALL make it clearly visible that all displayed classification results are proposals without legal effect, and that final classification is performed by BIT liaisons. This labelling SHALL be visible wherever results are shown and in the app header.

#### Scenario: Results are labelled
- **WHEN** proposal results are displayed for a Document
- **THEN** a note stating that results have no legal effect and are proposals subject to specialist review is visible in the results area

### Requirement: Rules reference screen
The Regelwerk route SHALL show a versioned reference of the classification rules: the ISV category table (meaning, legal basis per Art. 18–20 ISV, and whether the AI proposes that category — "geheim" proposed only on escalation with an Art. 24 ISV reference), the DSG definitions per Art. 5 DSG with short explanations including the profiling detection status, how justification, legal basis and findings work, and a model/operations card stating the model and that processing stays within the federal Perimeter.

#### Scenario: Opening the rules reference
- **WHEN** the end user opens `/rules`
- **THEN** the ISV table, DSG definitions, working-principles section and model/operations card are all visible

#### Scenario: Geheim documented as never proposed
- **WHEN** the ISV table is displayed
- **THEN** the "geheim" row indicates this category is not proposed in the normal flow: it is proposed only on escalation with an Art. 24 ISV reference and otherwise classified manually

### Requirement: Review guidance
The master-layout header SHALL provide a "Hinweise zur Prüfung" action opening guidance that states: results are proposals without legal effect, the findings list is shown for review, and the final classification is performed by BIT liaisons. The info alert in the Arbeitsbereich SHALL show the guidance title and text only, without an additional trigger action.

#### Scenario: Opening the guidance
- **WHEN** the end user activates the "Hinweise zur Prüfung" action in the master-layout header
- **THEN** the guidance panel with those points is displayed

#### Scenario: Info alert without trigger
- **WHEN** the Arbeitsbereich info alert is displayed
- **THEN** it shows only the guidance title and text, without a "Hinweise zur Prüfung" button

### Requirement: Upload multipart contract
The Classify UI SHALL upload the Document to `POST /v1/classify` as a multipart request with the file in a single field named `file`.

#### Scenario: Successful upload request
- **WHEN** the end user has provided a Document
- **THEN** the UI issues one multipart POST with field `file` to `/v1/classify` and waits for the classification

### Requirement: API base URL by environment
The Classify UI SHALL call the Classify Service through a configurable base URL: the development environment targets `http://localhost:8000` and the production build calls the Classify Service on the same origin it is served from.

#### Scenario: Development usage
- **WHEN** the Classify UI runs on the local dev server against a locally running Classify Service
- **THEN** requests go to `http://localhost:8000`

#### Scenario: Production usage
- **WHEN** the production build of the Classify UI is served
- **THEN** classify requests are issued relative to the serving origin

### Requirement: Proposal justification and legal basis
Each review card SHALL display the reasons of the proposal as a list and the legal basis as references.

#### Scenario: Reasons shown
- **WHEN** a Document with a completed analysis is selected
- **THEN** the review card shows the proposal's reasons as a list

#### Scenario: Legal basis shown
- **WHEN** a Document with a completed analysis is selected
- **THEN** the review card shows the proposal's legal basis as references

### Requirement: DSG findings list
The DSG review card SHALL list the recognised findings, each showing its category ("Personendaten" or "besonders schützenswerte Personendaten") and count.

#### Scenario: Findings listed
- **WHEN** a Document with a completed analysis is selected
- **THEN** the DSG review card lists that Document's findings with category and count

### Requirement: Classification failures shown
When a Document's classification request fails (service unavailable, an unsupported or unreadable Document, or the model cannot produce a valid result), the Classify UI SHALL mark that Document as failed with a visible reason and SHALL NOT lose the other Documents.

#### Scenario: Service unavailable
- **WHEN** the classify request fails without a response
- **THEN** the Document is shown as failed with a reason and the other Documents remain unaffected

#### Scenario: Model cannot produce a valid result
- **WHEN** the service responds that the model could not produce a valid classification
- **THEN** the Document is shown as failed with a reason
