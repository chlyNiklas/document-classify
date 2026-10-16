# Tasks: bake-rulebooks-into-image

## Implementation

- [x] 1. `git mv REGELWERK_ISG_KLASSIFIZIERUNG.md classify-service/regelwerk/` and `git mv REGELWERK_DSG_KLASSIFIZIERUNG.md classify-service/regelwerk/`
- [x] 2. `classify-service/Dockerfile`: add `COPY regelwerk/ /app/regelwerk/` and `ENV KOBY_ISG_RULEBOOK_PATH=/app/regelwerk/REGELWERK_ISG_KLASSIFIZIERUNG.md KOBY_DSG_RULEBOOK_PATH=/app/regelwerk/REGELWERK_DSG_KLASSIFIZIERUNG.md`
- [x] 3. `docker-compose.yml` (dev): remove the two rulebook volume mounts
- [x] 4. `docker-compose.prod.yml`: remove the two rulebook volume mounts
- [x] 5. Verify: `docker build classify-service` locally, run the container with no mounts/env, confirm startup logs show rulebooks loaded and `/v1/health` responds
