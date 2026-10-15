# Tasks

## 1. Foundation: mock data layer and routing

- [ ] 1.1 Create `MockClassificationService` with fixture sample documents (ISG level + confidence + justification, DSG assessment + confidence, evidence quotes with letters/paragraphs, simulated JSON response) and signals for document list, selection and per-document state; verify one unit test asserts every fixture's ISG level is proposal-capable (never `geheim`) with confidence present
- [ ] 1.2 Add the simulated four-stage analysis pipeline (ordered stage timers, per-document cancel) to the service; verify unit test covers stage progression on a fake-timer run and cancel removes the pending document
- [ ] 1.3 Update `app-routing-module.ts`: `'' → /work` redirect, `/work → WorkComponent`, `/rules → RulesComponent`, unknown route unchanged; delete `home` route/component and its spec; verify the build (`npm run build` or `ng build`) succeeds
- [ ] 1.4 Register the new Oblique modules needed (Alert, Notification, Spinner, Progress, Collapse, OffCanvas, Selectable) in `app-module.ts`; verify no missing-provider build errors

## 2. Arbeitsbereich — intake and busy state

- [ ] 2.1 Build the documents card: document list rows, per-document status badges, selection switching and the reminder tag badge; verify selection swaps the review area and a unit test covers the list render
- [ ] 2.2 Wire `ob-drop-zone` with the multi-file accept list and the reject paths (unsupported format, > 50 MB) showing an `ob-alert` with the reason while keeping existing documents; verify unit tests for accept/reject and that added documents are unaffected
- [ ] 2.3 Build the busy state: `ob-spinner` + `ob-progress` with the ordered four-stage `<ol>` that advances from the service, plus form-cancel button calling service cancel and a success info notification; verify unit test covers stage advancement rendering and cancel notification

## 3. Arbeitsbereich — review cards and findings

- [ ] 3.1 Build the ISG review card: four category tiles with proposal marked, `geheim` rendered disabled, confidence badge and justification text, low-confidence hint below 70 %; verify unit tests cover proposal marking, disabled geheim and the 70 %-threshold hint
- [ ] 3.2 Build the DSG review card: five assessment tiles with proposal marked, confidence and justification text; verify the proposal marking matches the fixture per document
- [ ] 3.3 Implement the evidence sections as `obCollapseHeader`/`obCollapseMain` accordions listing quotes with marker letters and references plus "Im Dokument anzeigen" actions; verify a unit test covers toggle behavior
- [ ] 3.4 Implement the document preview off-canvas via `OffCanvasService` showing German document text/quote text with all evidence quotes marked by letters; verify opening from the evidence section marks the previewed text
- [ ] 3.5 Implement the "Befund als JSON" off-canvas with flat JSON rendering and copy-to-clipboard plus (confirmed) success notification; verify unit test covers JSON content matching the document fixture
- [ ] 3.6 Add the results-area disclaimer (results without legal effect, simulated) and the "Weiteres Dokument hochladen" action; verify the note is rendered with proposals

## 4. Regelwerk screen

- [ ] 4.1 Build the ISG category table (Kategorie, Bedeutungen, Grundlagen/Artikeln, KI-Vorschlag flags including `geheim` -> "Nein · nur manuell") with a versioned badge; verify unit test covers the never-proposed flag for `geheim`
- [ ] 4.2 Build the three info cards: DSG definitions per Art. 5 DSG, working principles (Konfidenz/suggestions/findings) and Modell & Betrieb on premises/staying within the federal environment; verify unit test covers DSG definitions content

## 5. Chrome: navigation, guidance, notifications

- [ ] 5.1 Update `app.html` master layout: main-navigation items "Arbeitsbereich" (`/work`) and "Regelwerk" (`/rules`), demo badge and avatar/name in the topbar; verify route switching via navigation works in the unit test harness
- [ ] 5.2 Add the "Hinweise zur Prüfung" guidance surface (header action + `ob-alert` trigger, content opened via off-canvas) with the four guidance points; verify unit test covers the header action opening the panel

## 6. i18n and cleanup

- [ ] 6.1 Extend `i18n/de.json`, `i18n/fr.json`, `i18n/it.json` with all workbench chrome keys (labels, buttons, guidance, rule-card texts); fixture document content stays German; verify the app renders the chosen language via the existing language switch
- [ ] 6.2 Remove obsolete home styles/keys and tidy stylesheets, keeping component SCSS on Oblique variables for badges/tiles/cards/accountant footer/fidelity note; verify lint passes (`ng lint` or `eslint`)

## 7. Verification

- [ ] 7.1 Run the full vitest suite (`npm test` / `ng test` builder equivalent) and fix failures; all existing+new specs pass
- [ ] 7.2 Build production config and run `docker compose up --build`; verify UI reachable at port 4200, demo flows function end-to-end (add docs → analysis → review → findings/JSON/preview), German default and languages switch
