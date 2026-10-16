# Tasks

## 1. Remove the Regelwerk section

- [x] 1.1 Remove the `Regelwerk` entry (`{url: 'rules', label: 'koby.chrome.navigation.rules'}`) from the `[navigation]` array in `classify-ui/src/app/app.html`; verify only the `work` item remains in the master-layout navigation.
- [x] 1.2 Remove the `{path: 'rules', component: Rules, ...}` route and the `import {Rules}` line from `classify-ui/src/app/app-routing-module.ts`; verify the route table no longer references `Rules`.
- [x] 1.3 Remove the `import {Rules}` line and `Rules` from the `declarations` array in `classify-ui/src/app/app-module.ts`; verify `AppModule` compiles without the reference.
- [x] 1.4 Delete the `classify-ui/src/app/rules/` directory (`rules.ts`, `rules.html`, `rules.scss`, `rules.spec.ts`); verify no remaining file under `classify-ui/src` imports from `./rules`.
- [x] 1.5 Update the navigation test in `classify-ui/src/app/app.spec.ts` (currently asserts both `/work` and `/rules`) to assert that `/work` is present and `/rules` is absent; verify the test passes.
- [x] 1.6 Remove the `koby.rules.*` keys and the `koby.chrome.navigation.rules` key from `classify-ui/src/assets/i18n/de.json`, `fr.json` and `it.json`; verify all three files remain valid JSON and stay key-for-key in sync.

## 2. Remove the "Weiteres Dokument hochladen" action

- [x] 2.1 Remove the upload-more button and the hidden `#moreFilesInput` `<input type="file">` from `classify-ui/src/app/work/work-review.html`, keeping the disclaimer and the review cards; verify the review area still renders the disclaimer.
- [x] 2.2 Remove the `moreFilesInput` `viewChild`, `addMoreDocument()` and `readMoreFiles()` members from `classify-ui/src/app/work/work-review.ts`; verify the component compiles and no unused imports remain.
- [x] 2.3 Remove the `koby.work.upload-more` key from `de.json`, `fr.json` and `it.json`; verify all three files remain valid JSON and in sync.
- [x] 2.4 Remove the upload-more test from `classify-ui/src/app/work/work.spec.ts` ("opens the file picker and classifies another document from the review action"); verify the remaining suite passes.

## 3. Remove the empty-list hint sentence

- [x] 3.1 In `classify-ui/src/app/work/work-doc-list.html`, remove the sentence inside the `@else` branch (the `{{ "koby.work.empty" | translate }}` paragraph) while keeping a text-free empty-state container so the empty list still renders a reserved area rather than nothing.
- [x] 3.2 Remove the `koby.work.empty` key from `de.json`, `fr.json` and `it.json`; verify all three files remain valid JSON and in sync.
- [x] 3.3 Keep the `.doclist__empty` rule in `classify-ui/src/app/work/work-doc-list.scss` (adjust only if the now-empty container needs sizing); verify an empty document list renders the reserved area with no visible text.

## 4. Integration verification

- [x] 4.1 Run the Classify UI unit tests from `classify-ui/` (`npm test`) and verify the full suite passes with no references to the removed section, action or sentence. _(Suite is green except for a pre-existing, change-unrelated Oblique spinner assertion in `work.spec.ts` ("the spinner appears for rows rendered while the channel is already active"), which cascade-fails 7 more tests; left unfixed by decision. No failure references the removed section, action or sentence.)_
- [x] 4.2 Run `npm run lint` and `npm run build` from `classify-ui/` and verify both succeed.
- [x] 4.3 With the app running (`npm start`), verify `/work` is the only navigation item, `/rules` is unreachable via navigation, the review footer shows no upload action, and an empty document list shows no hint sentence.
