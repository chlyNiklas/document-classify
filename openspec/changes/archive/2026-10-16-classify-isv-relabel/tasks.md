# Tasks

## 1. German i18n relabel

- [x] 1.1 Update `classify-ui/src/assets/i18n/de.json`: review-card title to "Informationssicherheit (gemäss ISV)", rules title to "ISV", subtitle "Kategorien nach ISV" → "Kategorien nach ISV", principles legal-basis wording "ISV- ... DSG-Artikel", and the four `koby.rules.isg.basis.*` values to the ISV articles (Art. 18 / 18 / 19 / "Art. 20 ISV · Eskalation: Art. 24 ISV"); verify `npm test -- rules` still passes (tests use key fallbacks)

## 2. French and Italian i18n relabel

- [x] 2.1 Update `classify-ui/src/assets/i18n/fr.json` with the same ISV relabel in French, including ISV articles in the basis column; verify no "ISG" remains in the relabelled keys
- [x] 2.2 Update `classify-ui/src/assets/i18n/it.json` with the same ISV relabel in Italian, replacing "Art. 24 OSII" and "ISG/OSII" with ISV references; verify no "OSII" remains in the file

## 3. Verification

- [x] 3.1 Run the full `classify-ui` test suite and confirm it passes unchanged; grep `classify-ui/src/assets/i18n` for residual "gemäss ISG"/"nach ISG"/"OSII" and confirm only accepted leftovers (e.g. key names containing `isg`) remain
