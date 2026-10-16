# Tasks: add-docker-build-pipeline

## Implementation

- [x] 1. Create `.github/workflows/build.yml` triggered on push to `main` and tags `v*.*.*`
- [x] 2. Grant `contents: read` and `packages: write` permissions; use built-in `GITHUB_TOKEN` for GHCR login
- [x] 3. Add matrix jobs building `classify-service` (`./classify-service`) and `classify-ui` (`./classify-ui`) in parallel with `fail-fast: false`
- [x] 4. Configure tagging via `docker/metadata-action`: `dev` + `dev-<sha>` on main, semver on version tags, images pushed to `ghcr.io/chlyniklas/<image>`
- [x] 5. Add `type=gha` build cache to both image builds
