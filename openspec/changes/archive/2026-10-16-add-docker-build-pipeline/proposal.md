# Proposal: add-docker-build-pipeline

## Why

The project needs to be deployable, which requires publishable container images. Building images only on local machines is unrepeatable and unauditable, so image builds must be automated in CI on every push to `main`.

## What Changes

- Add a GitHub Actions workflow that builds both Docker images (`classify-service`, `classify-ui`) in parallel on every push to `main` and on version tags (`v*.*.*`).
- Push built images to GHCR (`ghcr.io/chlyniklas/<image>`), authenticated with the built-in `GITHUB_TOKEN` (no extra secrets).
- Tag `main` builds with a moving `dev` tag plus a `dev-<sha>` tag per build; version tags get the semver version (e.g. `1.2.3`). No `latest` tag — the compose file in the repo is for local dev only.
- Enable GitHub Actions layer caching to speed up dependency-layer builds.

## Capabilities

- **New Capabilities**:
  - `ci-pipeline` — automated build and publication of the project's container images on pushes to the default branch.

- **Modified Capabilities**: none

## Impact

- New file: `.github/workflows/build.yml`
- First pushes create two GHCR packages (private by default; visibility must be changed manually once if public access is wanted).
- No application code changes.
