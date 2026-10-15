from koby_classify.adapters.koby import KobyClient
from koby_classify.classification.rulebook import (
    build_assessment_system_prompt,
    load_dsg_rulebook,
    load_isg_rulebook,
)
from koby_classify.classification.service import ClassificationService
from koby_classify.config import get_settings


settings = get_settings()
koby_client = KobyClient(
    url=settings.koby_llm_url,
    token_url=settings.koby_token_url,
    client_id=settings.koby_client_id,
    client_secret=(
        settings.koby_client_secret.get_secret_value() if settings.koby_client_secret else None
    ),
    system_prompt=build_assessment_system_prompt(
        load_isg_rulebook(settings.isg_rulebook_path),
        load_dsg_rulebook(settings.dsg_rulebook_path),
    ),
    model=settings.koby_model,
    ca_bundle=settings.koby_ca_bundle,
    verify_tls=settings.koby_verify_tls,
    timeout_seconds=settings.koby_timeout_seconds,
)
classification_service = ClassificationService(koby_client)


def get_classification_service() -> ClassificationService:
    return classification_service

