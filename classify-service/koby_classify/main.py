from fastapi import FastAPI

from koby_classify.api.router import api_router
from koby_classify.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.application_name,
        version="0.1.0",
    )
    app.include_router(api_router)
    return app


app = create_app()

