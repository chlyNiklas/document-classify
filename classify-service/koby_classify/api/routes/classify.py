from typing import Annotated

from fastapi import APIRouter, Depends, File, Header, HTTPException, Response, UploadFile
from starlette.concurrency import run_in_threadpool

from koby_classify.api.dependencies import get_classification_service
from koby_classify.classification.models import (
    ClassificationRequest,
    ClassificationResponse,
    ResponseLanguage,
)
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


def select_response_language(accept_language: str | None) -> ResponseLanguage:
    if not accept_language:
        return ResponseLanguage.GERMAN

    candidates: list[tuple[float, int, ResponseLanguage]] = []
    for position, item in enumerate(accept_language.split(",")):
        parts = [part.strip() for part in item.split(";")]
        language_tag = parts[0].lower()
        quality = 1.0
        for parameter in parts[1:]:
            if parameter.lower().startswith("q="):
                try:
                    quality = float(parameter[2:])
                except ValueError:
                    quality = 0.0

        primary_language = language_tag.split("-", maxsplit=1)[0]
        if quality <= 0 or primary_language not in ResponseLanguage:
            continue
        candidates.append((quality, -position, ResponseLanguage(primary_language)))

    if not candidates:
        return ResponseLanguage.GERMAN
    return max(candidates)[2]


@router.post("", response_model=ClassificationResponse)
async def classify(
    file: Annotated[
        UploadFile,
        File(description="A PDF, DOCX, or UTF-8 plain-text document"),
    ],
    response: Response,
    service: Annotated[ClassificationService, Depends(get_classification_service)],
    settings: Annotated[Settings, Depends(get_settings)],
    accept_language: Annotated[
        str | None,
        Header(
            description=(
                "Preferred language for human-readable reasons: de, fr, or it. "
                "Defaults to de."
            )
        ),
    ] = None,
) -> ClassificationResponse:
    response_language = select_response_language(accept_language)
    response.headers["Content-Language"] = response_language.value

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
        return await service.classify(
            request,
            language=response_language,
        )
    except ClassificationUnavailableError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
