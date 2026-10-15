from koby_classify.classification.service import ClassificationService


classification_service = ClassificationService()


def get_classification_service() -> ClassificationService:
    return classification_service

