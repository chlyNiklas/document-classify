from koby_classify.classification.models import (
    ClassificationRequest,
    ClassificationResponse,
    ClassificationStatus,
)


class ClassificationService:
    """Placeholder implementation until extraction and inference are added."""

    def classify(self, request: ClassificationRequest) -> ClassificationResponse:
        del request
        return ClassificationResponse(status=ClassificationStatus.RECEIVED)

