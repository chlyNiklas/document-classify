from koby_classify.adapters.koby import KobyClient, KobyClientError
from koby_classify.classification.models import (
    ClassificationRequest,
    ClassificationResponse,
    ClassificationStatus,
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

        return ClassificationResponse(
            status=ClassificationStatus.COMPLETED,
            model_output=model_output,
        )

