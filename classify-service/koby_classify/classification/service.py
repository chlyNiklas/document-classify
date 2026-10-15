from pydantic import ValidationError

from koby_classify.adapters.koby import KobyClient, KobyClientError
from koby_classify.classification.models import (
    ClassificationRequest,
    ClassificationResponse,
)


class ClassificationUnavailableError(Exception):
    pass


class ClassificationService:
    def __init__(self, koby: KobyClient) -> None:
        self._koby = koby

    async def classify(self, request: ClassificationRequest) -> ClassificationResponse:
        try:
            model_output = await self._koby.classify(request.text)
        except KobyClientError as error:
            raise ClassificationUnavailableError(str(error)) from error

        try:
            return ClassificationResponse.model_validate_json(model_output)
        except ValidationError as error:
            raise ClassificationUnavailableError(
                "KOBY response does not satisfy the ISG rulebook schema"
            ) from error

