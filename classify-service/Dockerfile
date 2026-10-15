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

EXPOSE 8000

CMD ["/app/.venv/bin/uvicorn", "koby_classify.main:app", "--host", "0.0.0.0", "--port", "8000"]
