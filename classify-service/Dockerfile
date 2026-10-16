FROM python:3.13-slim AS base

ENV PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    PYTHONDONTWRITEBYTECODE=1

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Install dependencies first (cached layer): copy only what uv needs to sync.
COPY pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-dev

# Copy the application code.
COPY koby_classify ./koby_classify

# Bake the classification rulebooks into the image and point the service at
# them, so a deployed container needs no rulebook files from the host.
COPY regelwerk/ /app/regelwerk/
ENV KOBY_ISG_RULEBOOK_PATH=/app/regelwerk/REGELWERK_ISG_KLASSIFIZIERUNG.md \
    KOBY_DSG_RULEBOOK_PATH=/app/regelwerk/REGELWERK_DSG_KLASSIFIZIERUNG.md

EXPOSE 8000

CMD ["/app/.venv/bin/uvicorn", "koby_classify.main:app", "--host", "0.0.0.0", "--port", "8000"]
