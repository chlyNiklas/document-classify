from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from koby_classify.api.dependencies import get_classification_service
from koby_classify.classification.models import ClassificationRequest, ClassificationResponse
from koby_classify.classification.service import ClassificationService, ClassificationUnavailableError


router = APIRouter()


@router.post("", response_model=ClassificationResponse)
async def classify(
    request: ClassificationRequest,
    service: Annotated[ClassificationService, Depends(get_classification_service)],
) -> ClassificationResponse:
    try:
        return await service.classify(request)
    except ClassificationUnavailableError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
