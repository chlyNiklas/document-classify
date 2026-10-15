import json
from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import AliasChoices, BeforeValidator, Field, SecretStr
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


def _split_origins(value: object) -> object:
    if isinstance(value, str):
        stripped = value.strip()
        if stripped.startswith("["):
            return json.loads(stripped)
        return [origin.strip() for origin in stripped.split(",") if origin.strip()]
    return value


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="KOBY_CLASSIFY_",
        extra="ignore",
    )

    application_name: str = "Document Classify Service"
    environment: str = "local"
    log_level: str = "INFO"
    api_prefix: str = "/v1"
    koby_llm_url: str | None = Field(default=None, validation_alias="KOBY_LLM_URL")
    koby_token_url: str = Field(
        default=(
            "https://r.auth.koby.admin.ch/realms/"
            "fbcfa3d6-6fad-43fb-9d37-0c76a28495f6/protocol/openid-connect/token"
        ),
        validation_alias="KOBY_TOKEN_URL",
    )
    koby_client_id: str | None = Field(default=None, validation_alias="KOBY_CLIENT_ID")
    koby_client_secret: SecretStr | None = Field(
        default=None,
        validation_alias=AliasChoices("KOBY_CLIENT_SECRET", "KOBY_API_KEY"),
    )
    koby_model: str | None = Field(default=None, validation_alias="KOBY_MODEL")
    koby_timeout_seconds: float = Field(
        default=120.0,
        gt=0,
        validation_alias="KOBY_TIMEOUT_SECONDS",
    )
    isg_rulebook_path: Path | None = Field(
        default=None,
        validation_alias="KOBY_ISG_RULEBOOK_PATH",
    )
    dsg_rulebook_path: Path | None = Field(
        default=None,
        validation_alias="KOBY_DSG_RULEBOOK_PATH",
    )
    koby_ca_bundle: str | None = Field(default=None, validation_alias="KOBY_CA_BUNDLE")
    koby_verify_tls: bool = Field(default=True, validation_alias="KOBY_VERIFY_TLS")
    max_upload_bytes: int = Field(default=10 * 1024 * 1024, gt=0)
    max_extracted_characters: int = Field(default=100_000, gt=0)
    cors_origins: Annotated[list[str], NoDecode, BeforeValidator(_split_origins)] = [
        "http://localhost:4200"
    ]


@lru_cache
def get_settings() -> Settings:
    return Settings()

