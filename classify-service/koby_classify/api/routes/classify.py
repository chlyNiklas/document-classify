from typing import Annotated

from fastapi import APIRouter, Depends

from koby_classify.api.dependencies import get_classification_service
from koby_classify.classification.models import ClassificationRequest, ClassificationResponse
from koby_classify.classification.service import ClassificationService


router = APIRouter()


@router.post("", response_model=ClassificationResponse)
async def classify(
    request: ClassificationRequest,
    service: Annotated[ClassificationService, Depends(get_classification_service)],
) -> ClassificationResponse:
    return service.classify(request)
