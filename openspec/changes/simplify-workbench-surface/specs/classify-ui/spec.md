# Spec Delta

## MODIFIED Requirements

### Requirement: Single-feature entry point
The Classify UI SHALL present document classification as the primary and only end-user feature, delivered as the document-review workbench. Its only route is `/work` (Arbeitsbereich, the default), reachable from the master-layout main navigation; no other end-user features are offered.

#### Scenario: Opening the app
- **WHEN** an end user opens the Classify UI at its served address
- **THEN** the default route shows the Arbeitsbereich review surface of the workbench

### Requirement: Workbench navigation
The master-layout main navigation SHALL offer the item "Arbeitsbereich" (route `/work`) as its only destination, and activating it SHALL display the Arbeitsbereich.

#### Scenario: Switching sections
- **WHEN** the end user activates the "Arbeitsbereich" main-navigation item
- **THEN** the Arbeitsbereich is displayed at its route

## REMOVED Requirements

### Requirement: Rules reference screen
**Reason**: The Regelwerk section is removed from the end-user surface. Its static rules reference is not part of the classification flow, and dropping it removes a whole route, component and translation set.
**Migration**: No in-app replacement. The classification rules remain enforced by the Classify Service; users who need the reference no longer have a dedicated screen for it.
