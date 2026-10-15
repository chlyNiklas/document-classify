# Angular with Oblique for the Classify UI; CORS-based integration

The Classify UI is built with Angular 22 plus `@oblique/oblique` 16 (the Swiss Confederation's unified frontend ecosystem), chosen over framework alternatives (Next.js, Vite+React) because Oblique ships the Swiss eGovernment design and ready-made end-user components — notably `<ob-drop-zone>`, used for the single-file Document upload instead of a third-party drag-and-drop library. The app follows Oblique's official scaffold conventions: NgModule-based (`app-module.ts`), the Swiss trilingual locales de-CH/fr-CH/it-CH with Document labels in all three, and named build configurations (local/dev/ref/test/abn/prod) with fileReplacements per BIT environment.

Integration between UI and service is direct HTTP with CORS (origins via `KOBY_CLASSIFY_cors_origins`, default `http://localhost:4200`); a build-time dev proxy was rejected because the CORS surface is part of the eventual production contract, so dev reflects prod.

## Deliberate deviations / fixes someone might "revert"

- Build uses the modern `@angular/build:application` and `@angular/build:dev-server` builders, NOT the original scaffold's `@angular-devkit/build-angular:browser` (deprecated webpack variant). Two reasons: (1) the legacy builder silently ignored `fileReplacements` under Angular CLI 22, (2) webpack support is deprecated — keep the migration.
- The prod → `environment.prod.ts` fileReplacement lives in the default `production` build configuration, not behind `-c` flags: `npm run build -c prod` is a trap because npm swallows the bare `-c` flag and runs a plain build. If you "simplify" by removing it, every production bundle will ship a dev URL.
- Classify labels/pending/error keys are prefixed `koby.classify.*` in `src/assets/i18n/{de,fr,it}.json`; the drop-zone caption overrides Oblique's `i18n.oblique.file-upload.caption` key (app files merge after Oblique's own).
