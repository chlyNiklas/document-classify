from fastapi import APIRouter

from koby_classify.api.routes import classify, health
from koby_classify.config import get_settings


settings = get_settings()

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(
    classify.router,
    prefix=f"{settings.api_prefix}/classify",
    tags=["classification"],
)

