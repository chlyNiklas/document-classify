# Spec Delta

## MODIFIED Requirements

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

### Requirement: Rules reference screen
The Regelwerk route SHALL show a versioned reference of the classification rules: the ISV category table (meaning, legal basis per Art. 18–20 ISV, and whether the AI proposes that category — "geheim" proposed only on escalation with an Art. 24 ISV reference), the DSG definitions per Art. 5 DSG with short explanations including the profiling detection status, how justification, legal basis and findings work, and a model/operations card stating the model and that processing stays within the federal Perimeter.

#### Scenario: Opening the rules reference
- **WHEN** the end user opens `/rules`
- **THEN** the ISV table, DSG definitions, working-principles section and model/operations card are all visible

#### Scenario: Geheim documented as never proposed
- **WHEN** the ISV table is displayed
- **THEN** the "geheim" row indicates this category is not proposed in the normal flow: it is proposed only on escalation with an Art. 24 ISV reference and otherwise classified manually
