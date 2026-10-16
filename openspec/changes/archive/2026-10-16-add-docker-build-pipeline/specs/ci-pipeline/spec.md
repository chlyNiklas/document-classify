# ci-pipeline Delta Spec

## Purpose

Continuous integration must build the project's two container images and publish them to a container registry whenever the default branch changes, so that deployments can pull reproducible, traceable images instead of depending on local builds.

## ADDED Requirements

### Requirement: Build container images on push to default branch

The CI system SHALL build both Docker images (`classify-service` and `classify-ui`) on every push to the default branch (`main`), running the two builds in parallel.

#### Scenario: Push to main triggers both image builds

- **WHEN** a commit is pushed to `main`
- **THEN** the CI workflow builds the `classify-service` image from `./classify-service` and the `classify-ui` image from `./classify-ui`
- **AND** the two builds run as independent jobs so a failure in one does not cancel the other

#### Scenario: A failing build does not block the other image

- **WHEN** the `classify-service` build fails
- **THEN** the `classify-ui` build still runs to completion and reports its own result

### Requirement: Publish images to GHCR with traceable tags

The CI system SHALL push built images to GitHub Container Registry under `ghcr.io/chlyniklas/<image>` and SHALL NOT use a `latest` tag for default-branch builds.

#### Scenario: Main push produces dev tags

- **WHEN** an image build succeeds for a push to `main`
- **THEN** the image is pushed tagged `dev` and `dev-<short-commit-sha>`
- **AND** no `latest` tag is produced for main-branch builds

#### Scenario: Version tag produces semver tag

- **WHEN** a tag matching `v<MAJOR>.<MINOR>.<PATCH>` is pushed
- **THEN** the images are pushed tagged with the version without the `v` prefix (e.g. `1.2.3`)

### Requirement: Registry authentication without repository secrets

The CI system SHALL authenticate to GHCR using the workflow's built-in `GITHUB_TOKEN` with `packages: write` permission, requiring no manually configured repository secrets.

#### Scenario: Workflow logs in to GHCR

- **WHEN** the publish job runs
- **THEN** it logs in to `ghcr.io` with username `github.actor` and password `${{ secrets.GITHUB_TOKEN }}`
- **AND** no additional repository secrets are required for the workflow to pass a build

### Requirement: Layer caching for builds

The CI system SHALL use GitHub Actions layer caching (`type=gha`) so repeated builds reuse unchanged dependency layers.

#### Scenario: Repeated build reuses cached layers

- **WHEN** a second build runs for an image whose dependency layers are unchanged
- **THEN** those layers are restored from the GitHub Actions cache instead of being rebuilt
