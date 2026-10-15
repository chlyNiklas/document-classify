from koby_classify.adapters.koby import KobyClient
from koby_classify.classification.service import ClassificationService
from koby_classify.config import get_settings


settings = get_settings()
koby_client = KobyClient(
    url=settings.koby_llm_url,
    api_key=(settings.koby_api_key.get_secret_value() if settings.koby_api_key else None),
    model=settings.koby_model,
    api_key_header=settings.koby_api_key_header,
    ca_bundle=settings.koby_ca_bundle,
    verify_tls=settings.koby_verify_tls,
)
classification_service = ClassificationService(koby_client)


def get_classification_service() -> ClassificationService:
    return classification_service

