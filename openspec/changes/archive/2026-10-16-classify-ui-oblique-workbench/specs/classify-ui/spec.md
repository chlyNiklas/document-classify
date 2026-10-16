# Spec Delta — classify-ui (multi-document demo workbench)

## MODIFIED Requirements

### Requirement: Single-feature entry point
The Classify UI SHALL present document classification as the primary and only end-user feature, delivered as the document-review workbench. Its routes are `/work` (Arbeitsbereich, the default) and `/rules` (Regelwerk), reachable from the master-layout main navigation; no other end-user features are offered.

#### Scenario: Opening the app
- **WHEN** an end user opens the Classify UI at its served address
- **THEN** the default route shows the Arbeitsbereich review surface of the workbench

### Requirement: Document drop zone accepts exactly the supported formats
The Classify UI SHALL let the end user add one or more Documents by drag-and-drop or file selection. Files in the supported formats (`pdf`, `docx`, `doc`, `xlsx`, `xls`, `csv`, `txt`, `md`, `eml`, `msg`, `ics`, `xml`, `pptx`, `rtf`, `odt`, `png`, `jpg`, `jpeg`, `tif`, `tiff`) SHALL become individual Document entries, each independently analysed. The UI SHALL reject other formats and files exceeding the size limit (50 MB) with a visible reason, without losing already added Documents.

#### Scenario: Dropping a supported file
- **WHEN** the end user drops a file in a supported format
- **THEN** the file becomes a Document entry with its own status and analysis

#### Scenario: Dropping multiple files
- **WHEN** the end user drops multiple files at once
- **THEN** every supported file becomes a Document entry, each analysed independently

#### Scenario: Dropping an unsupported file
- **WHEN** the end user drops a file in an unsupported format
- **THEN** the UI shows a rejection reason naming the format and the supported types, and already added Documents remain untouched

### Requirement: Pending state visible while classifying
While a Document is being analysed, the Classify UI SHALL show a visible analysis pipeline that progresses through ordered stages (text extraction, personal-data recognition, rule application, proposal creation) as the analysis proceeds, and SHALL allow the end user to cancel the analysis of that Document.

#### Scenario: Waiting for the result
- **WHEN** a Document analysis runs and no result has arrived yet
- **THEN** the UI displays the pipeline stages completing in order with a visible progress indication until the proposal result appears

#### Scenario: Pending indication is accessible
- **WHEN** a Document's row shows the pending indication
- **THEN** the pending indication exposes an accessible name conveying that the Document is being analysed

#### Scenario: Cancelling an analysis
- **WHEN** the end user cancels a running analysis
- **THEN** the Document is removed without a result and the UI confirms the cancellation by notification

## REMOVED Requirements

### Requirement: Upload multipart contract
**Reason**: The demo-first workbench issues no classification requests; results are simulated with fixture data. The multipart contract is preserved in code but suspended until a later change defines and wires the richer response schema.
**Migration**: Re-add the upload contract when the real classification wiring replaces the demo data layer; the endpoint call in `home.ts` is parked, not deleted.

### Requirement: Classification shown verbatim
**Reason**: Results are now structured simulated proposals (category tiles, confidence, justification, findings) rather than the raw service body; verbatim display would misrepresent non-existent responses.
**Migration**: Replaced by the ADDED requirements "ISG proposal review", "Proposal confidence and justification" and "Findings JSON access"; revisit when real responses exist.

### Requirement: Failures shown raw
**Reason**: No HTTP classification requests are issued in the demo, so there is no raw HTTP failure surface to show honestly; failures are file-level (format, size) and shown directly in the UI.
**Migration**: Re-add when classification requests resume; until then the intake requirement covers visible rejection reasons.

### Requirement: API base URL by environment
**Reason**: With classification calls suspended, no base URL is exercised at runtime; keeping a "SHALL call" requirement would describe behavior that does not occur.
**Migration**: Re-add unchanged together with the upload contract when real classification wiring lands; the environment configuration itself is retained in the app.

## ADDED Requirements

### Requirement: Workbench navigation
The master-layout main navigation SHALL offer the items "Arbeitsbereich" (route `/work`) and "Regelwerk" (route `/rules`), and navigation SHALL switch between the two sections.

#### Scenario: Switching sections
- **WHEN** the end user activates a main-navigation item
- **THEN** the corresponding section is displayed at its route

### Requirement: ISG proposal review
The Arbeitsbereich SHALL show, for the selected Document, a review card proposing one information-security category among "nicht klassifiziert", "intern", "vertraulich" and "geheim", with the proposal tile visually marked. The "geheim" tile SHALL be rendered as disabled and SHALL never be proposed or selectable.

#### Scenario: Proposal shown for selected document
- **WHEN** the end user selects a Document with a completed analysis
- **THEN** the review card shows that Document's proposed ISG category and marking

#### Scenario: Geheim is never proposed
- **WHEN** the review card for a Document is displayed
- **THEN** the "geheim" tile is visible but disabled, and no proposal targets it

#### Scenario: Switching selected documents
- **WHEN** the end user selects a different Document
- **THEN** the review cards show that Document's own proposal, confidence and justification

### Requirement: Proposal confidence and justification
Each review card SHALL display the confidence of the simulated proposal and its justification text. When the confidence falls below 70 %, the UI SHALL additionally show a low-confidence hint that the model is unsure and the decision is at the reviewer's discretion.

#### Scenario: Confidence below 70 per cent
- **WHEN** a Document's simulated proposal confidence is below 70 %
- **THEN** a low-confidence hint is shown next to the proposal

#### Scenario: Confidence at 70 per cent or above
- **WHEN** a Document's simulated proposal confidence is 70 % or higher
- **THEN** the confidence is shown without the low-confidence hint

### Requirement: DSG assessment
Each review card set SHALL include a DSG assessment with five assessment tiles — "keine Personendaten", "Personendaten", "besonders schützenswerte Personendaten", "Profiling", "Profiling mit hohem Risiko" — with the simulated proposal tile visually marked and its confidence shown.

#### Scenario: DSG proposal shown
- **WHEN** a Document with a completed analysis is selected
- **THEN** the DSG assessment shows the proposed assessment tile with its confidence

### Requirement: Evidence traceability
Each review card SHALL offer a collapsible findings section listing evidence quotes with a marker letter and a reference (page and paragraph). Each evidence entry SHALL offer an action that opens a document preview showing the Document text with all evidence quotes marked by their letters.

#### Scenario: Expanding findings
- **WHEN** the end user expands the findings section of a review card
- **THEN** the evidence quotes are listed with marker letters and references, each with a "Show in document" action

#### Scenario: Document preview marks evidence
- **WHEN** the end user activates "Im Dokument anzeigen" for any evidence entry
- **THEN** a document preview opens showing the Document text with the quoted passages marked by their letter

### Requirement: Findings JSON access
The Arbeitsbereich SHALL offer an action opening the classification response ("Befund als JSON") in an off-canvas or dialog for the selected Document, showing the simulated response as formatted JSON, and SHALL provide a copy action that confirms success by notification.

#### Scenario: Opening the findings JSON
- **WHEN** the end user activates "Befund als JSON"
- **THEN** the simulated classification response is shown as formatted JSON

#### Scenario: Copying the findings JSON
- **WHEN** the end user activates the copy action in the JSON view
- **THEN** the JSON is copied to the clipboard and success is confirmed by notification

### Requirement: Demo result labelling
The Classify UI SHALL make it clearly visible that all displayed classification results are simulated and carry no legal effect, and that final classification is performed by BIT liaisons. This labelling SHALL be visible wherever results are shown and in the app header (demo badge).

#### Scenario: Results are labelled
- **WHEN** proposal results are displayed for a Document
- **THEN** a note stating that results have no legal effect and are simulated is visible in the results area

### Requirement: Rules reference screen
The Regelwerk route SHALL show a versioned reference of the classification rules: the ISG category table (meaning, legal basis, and whether the AI proposes that category — "geheim" marked as never proposed), the DSG definitions per Art. 5 DSG with short explanations, how confidence, justification and findings work, and a model/operations card stating the model and that processing stays within the federal Perimeter.

#### Scenario: Opening the rules reference
- **WHEN** the end user opens `/rules`
- **THEN** the ISG table, DSG definitions, working-principles section and model/operations card are all visible

#### Scenario: Geheim documented as never proposed
- **WHEN** the ISG table is displayed
- **THEN** the "geheim" row indicates that this category is not proposal-capable and is only classified manually

### Requirement: Review guidance
The master-layout header SHALL provide a "Hinweise zur Prüfung" action opening guidance that states: results are proposals without legal effect, to check findings via "Im Dokument anzeigen", that low confidence means the model is undecided, and that "geheim" is only classified manually. The info alert in the Arbeitsbereich SHALL show the guidance title and text only, without an additional trigger action.

#### Scenario: Opening the guidance
- **WHEN** the end user activates the "Hinweise zur Prüfung" action in the master-layout header
- **THEN** the guidance panel with those four points is displayed

#### Scenario: Info alert without trigger
- **WHEN** the Arbeitsbereich info alert is displayed
- **THEN** it shows only the guidance title and text, without a "Hinweise zur Prüfung" button
