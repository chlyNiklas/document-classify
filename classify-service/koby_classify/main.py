from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from koby_classify.api.router import api_router
from koby_classify.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.application_name,
        version="0.1.0",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
        allow_credentials=False,
    )
    app.include_router(api_router)
    return app


app = create_app()

