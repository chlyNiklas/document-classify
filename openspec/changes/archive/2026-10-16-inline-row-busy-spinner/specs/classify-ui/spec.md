# Spec Delta

## MODIFIED Requirements

### Requirement: Pending state visible while classifying
While a Document is being analysed, the Classify UI SHALL show a visible pending indication on that Document's row in the document table — a spinner replacing the row's status label, accessible to screen readers via its accessible name — until the classification result or a failure is shown. The rest of the UI SHALL stay interactive while the analysis runs, and the Classify UI SHALL allow the end user to cancel the analysis of that Document from its row.

#### Scenario: Waiting for the result
- **WHEN** a Document analysis runs and no result has arrived yet
- **THEN** the Document's table row shows a spinner in place of the status label until the proposal result appears, and the rest of the page remains interactive

#### Scenario: Pending indication is accessible
- **WHEN** a Document's row shows the pending spinner
- **THEN** the spinner exposes an accessible name conveying that the Document is being analysed

#### Scenario: Cancelling an analysis
- **WHEN** the end user cancels a running analysis from the Document's row
- **THEN** the Document is removed without a result and the UI confirms the cancellation by notification
