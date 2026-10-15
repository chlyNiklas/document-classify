from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

from koby_classify.api.dependencies import get_classification_service
from koby_classify.classification.models import ClassificationRequest, ClassificationResponse
from koby_classify.classification.service import (
    ClassificationService,
    ClassificationUnavailableError,
)
from koby_classify.config import Settings, get_settings
from koby_classify.extraction.service import (
    DocumentExtractionError,
    DocumentTooLongError,
    UnsupportedDocumentTypeError,
    extract_text,
)


router = APIRouter()


@router.post("", response_model=ClassificationResponse)
async def classify(
    file: Annotated[
        UploadFile,
        File(description="A PDF, DOCX, or UTF-8 plain-text document"),
    ],
    service: Annotated[ClassificationService, Depends(get_classification_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ClassificationResponse:
    try:
        content = await file.read(settings.max_upload_bytes + 1)
    finally:
        await file.close()

    if len(content) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the {settings.max_upload_bytes} byte upload limit",
        )

    try:
        text = await run_in_threadpool(
            extract_text,
            content,
            file.filename,
            file.content_type,
            settings.max_extracted_characters,
        )
    except UnsupportedDocumentTypeError as error:
        raise HTTPException(status_code=415, detail=str(error)) from error
    except DocumentTooLongError as error:
        raise HTTPException(status_code=413, detail=str(error)) from error
    except DocumentExtractionError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    request = ClassificationRequest(
        text=text,
        source=file.filename,
        context={"content_type": file.content_type or ""},
    )
    try:
        return await service.classify(request)
    except ClassificationUnavailableError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
