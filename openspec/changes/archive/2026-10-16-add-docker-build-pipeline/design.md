# Design: add-docker-build-pipeline

## Context

The repo contains two containerized components, each with its own Dockerfile: `classify-service` (Python/FastAPI, uv-managed) and `classify-ui` (Angular built into nginx). There was no CI in the repository. The GitHub remote is `chlyNiklas/document-classify`.

## Goals / Non-Goals

- **Goals:** automated, reproducible image builds on `main`; traceable tags; zero secret setup.
- **Non-Goals:** deployment to any runtime (K8s/compose on a server); running tests in CI; building on PRs.

## Decisions

- **GHCR over Docker Hub:** works with the built-in `GITHUB_TOKEN` (`packages: write` permission), no PAT or Docker Hub secrets to manage.
- **Matrix job with `fail-fast: false`:** the two images are independent; one broken build should not mask the other's result.
- **`docker/metadata-action` for tagging:** it lowercases the image path automatically, which GHCR requires (owner is `chlyNiklas`). Tags: `dev` (moving, main only), `dev-<sha>` (per-build, rollback-friendly), semver on `v*.*.*` tags.
- **`dev` instead of `latest`:** the in-repo `docker-compose.yml` is for local development; `latest` would imply a production-ready pointer that doesn't exist yet. `dev-<sha>` keeps every main build individually pullable.
- **`type=gha` build cache:** dependency layers (uv sync, npm ci) dominate build time; GHA cache is free and scoped to the repo.

## Risks / Trade-offs

- First run creates the GHCR packages as **private**; public visibility must be flipped manually once in GitHub package settings.
- No test execution before push: broken images can reach `:dev`. Accepted for now; tests-in-CI can be a follow-up change.
