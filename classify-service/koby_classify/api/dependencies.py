from koby_classify.adapters import (
    AssessConnector,
    KobyClient,
    OpenCodeGoClient,
)
from koby_classify.classification.rulebook import (
    build_dsg_system_prompt,
    build_isg_system_prompt,
    load_dsg_rulebook,
    load_isg_rulebook,
)
from koby_classify.classification.service import ClassificationService
from koby_classify.config import Settings, get_settings


class ConfigError(RuntimeError):
    pass



settings = get_settings()


def _build_connector(settings: "Settings") -> AssessConnector:
    if settings.llm_provider == "koby":
        return KobyClient(
            url=settings.koby_llm_url,
            token_url=settings.koby_token_url,
            client_id=settings.koby_client_id,
            client_secret=(
                settings.koby_client_secret.get_secret_value()
                if settings.koby_client_secret
                else None
            ),
            model=settings.koby_model,
            ca_bundle=settings.koby_ca_bundle,
            verify_tls=settings.koby_verify_tls,
            timeout_seconds=settings.koby_timeout_seconds,
            reasoning_effort=settings.koby_reasoning_effort,
        )
    if not settings.opencode_api_key:
        raise ConfigError("LLM_PROVIDER=opencode requires OPENCODE_API_KEY")
    return OpenCodeGoClient(
        url=settings.opencode_base_url,
        api_key=settings.opencode_api_key.get_secret_value(),
        model=settings.opencode_model,
        timeout_seconds=settings.opencode_timeout_seconds,
        reasoning_effort=settings.opencode_reasoning_effort,
    )


connector = _build_connector(settings)
classification_service = ClassificationService(
    connector,
    isg_system_prompt=build_isg_system_prompt(
        load_isg_rulebook(settings.isg_rulebook_path)
    ),
    dsg_system_prompt=build_dsg_system_prompt(
        load_dsg_rulebook(settings.dsg_rulebook_path)
    ),
    chunk_characters=settings.classification_chunk_characters,
)


def get_classification_service() -> ClassificationService:
    return classification_service

