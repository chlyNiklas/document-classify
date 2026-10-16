# Proposal: bake-rulebooks-into-image

## Why

The two REGELWERK rulebooks are the only runtime inputs requiring the deployment host to hold repo files — `docker-compose.prod.yml` currently mounts them from disk. Baking them into the `classify-service` image makes the image self-contained, so a VPS deploy needs only the compose file, the service `.env`, and the GHCR images.

## What Changes

- `git mv` `REGELWERK_ISG_KLASSIFIZIERUNG.md` and `REGELWERK_DSG_KLASSIFIZIERUNG.md` into `classify-service/regelwerk/` (bringing them inside the existing build context).
- `classify-service/Dockerfile`: `COPY regelwerk/ /app/regelwerk/` and set default env `KOBY_ISG_RULEBOOK_PATH=/app/regelwerk/REGELWERK_ISG_KLASSIFIZIERUNG.md`, `KOBY_DSG_RULEBOOK_PATH=/app/regelwerk/REGELWERK_DSG_KLASSIFIZIERUNG.md`.
- `docker-compose.yml` (dev): drop the rulebook volume mounts (the baked-in copies serve dev too).
- `docker-compose.prod.yml`: drop the rulebook volume mounts and the rulebook-path env entries.
- Rulebook path config fields stay optional (`None` default) so alternative rulebooks can still be mounted for experiments.
- Update strategy becomes: edit `md` → push → CI rebuilds → VPS `docker compose pull && up -d`. Rulebook updates restart with container replacement (rulebooks load at startup either way).

## Capabilities

- **New Capabilities**: none
- **Modified Capabilities**:
  - `ci-pipeline` — the published `classify-service` image must contain the classification rulebooks, so deployed containers run without host-provided rulebook files.

## Impact

- Affected files: `classify-service/regelwerk/*` (moved), `classify-service/Dockerfile`, `docker-compose.yml`, `docker-compose.prod.yml`
- No application code changes; config fields and validators untouched.
- Local dev unaffected (paths come from Dockerfile env defaults; `.env` overrides still win).
- Build context stays `./classify-service`; no CI workflow changes needed.
