# ci-pipeline Delta Spec

## MODIFIED Requirements

### Requirement: Build container images on push to default branch

The CI system SHALL build both Docker images (`classify-service` and `classify-ui`) on every push to the default branch (`main`), running the two builds in parallel.

The `classify-service` image SHALL contain the classification rulebooks at fixed paths inside the image, so that a deployed container runs without rulebook files provided by the host.

#### Scenario: Push to main triggers both image builds

- **WHEN** a commit is pushed to `main`
- **THEN** the CI workflow builds the `classify-service` image from `./classify-service` and the `classify-ui` image from `./classify-ui`
- **AND** the two builds run as independent jobs so a failure in one does not cancel the other

#### Scenario: A failing build does not block the other image

- **WHEN** the `classify-service` build fails
- **THEN** the `classify-ui` build still runs to completion and reports its own result

#### Scenario: Service image contains rulebooks

- **WHEN** the `classify-service` image is built
- **THEN** `REGELWERK_ISG_KLASSIFIZIERUNG.md` and `REGELWERK_DSG_KLASSIFIZIERUNG.md` exist under `/app/regelwerk/` inside the image
- **AND** the image defaults `KOBY_ISG_RULEBOOK_PATH` and `KOBY_DSG_RULEBOOK_PATH` to those paths, so the service loads the rulebooks at startup with no host mounts or env configuration
- **AND** an explicit `KOBY_ISG_RULEBOOK_PATH` / `KOBY_DSG_RULEBOOK_PATH` env value still overrides the baked-in paths

#### Scenario: Deployed service starts without host-provided rulebooks

- **WHEN** a container from the published `classify-service` image starts with no rulebook volumes or rulebook env vars configured
- **THEN** the service starts successfully and serves classification using the baked-in rulebooks
