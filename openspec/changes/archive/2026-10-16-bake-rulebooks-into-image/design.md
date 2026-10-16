# Design: bake-rulebooks-into-image

## Context

The service loads two rulebook markdown files at startup via optional config paths (`KOBY_ISG_RULEBOOK_PATH`, `KOBY_DSG_RULEBOOK_PATH`, validated in `config.py`, consumed in `api/dependencies.py`). The files currently live at the repo root, outside the `./classify-service` build context, so both compose files mount them from the host. The prod compose was created specifically to avoid a repo checkout on the VPS, and these mounts are the last host-file dependency.

## Goals / Non-Goals

- **Goals:** self-contained service image; rulebook updates flow through the existing CI (`edit → push → build → pull`); no build-context or CI changes.
- **Non-Goals:** runtime rulebook reloading; a rulebook content API; baking rulebooks into the UI image; moving rulebook handling out of config.

## Decisions

- **Option A — move files into the build context (`git mv` to `classify-service/regelwerk/`)** over widening the build context to the repo root. Rationale: keeps the context small, avoids cache-busting the copy layer on unrelated commits, keeps the change confined to the service. Alternative rejected: `COPY` from repo root requires context `.` for the CI matrix and rebuilds on every repo change.
- **Defaults in the Dockerfile via `ENV`, not in `config.py`:** the Python defaults stay `None`; containerization provides the paths. Keeps the app host-friendly (local `uv run` dev can still set paths or omit rulebooks if code tolerates it).
- **Dev compose drops the mounts too:** dev builds from the same source, so the baked-in files serve dev; `.env` overrides remain available for experimenting with edited rulebooks.
- **`git mv` preserves history** for the two tracked files.

## Risks / Trade-offs

- Rulebook edits now deploy on the image pipeline (~2 min) instead of an on-host file edit + restart. Accepted: rulebooks load at startup only, so the mount path bought no hot-reload anyway.
- If someone edits the files on the VPS filesystem, the change is lost on the next pull — but that was already true for the mounted files' repo copies.
- Divergence risk between `KOBY_CLASSIFY_API_PREFIX`-style env overrides and baked paths: none in practice, since paths are absolute and fixed in the image.
