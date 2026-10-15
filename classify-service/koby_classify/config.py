from functools import lru_cache

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


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
    koby_api_key: SecretStr | None = Field(default=None, validation_alias="KOBY_API_KEY")
    koby_model: str | None = Field(default=None, validation_alias="KOBY_MODEL")
    koby_api_key_header: str = Field(
        default="Authorization",
        validation_alias="KOBY_API_KEY_HEADER",
    )
    koby_ca_bundle: str | None = Field(default=None, validation_alias="KOBY_CA_BUNDLE")
    koby_verify_tls: bool = Field(default=True, validation_alias="KOBY_VERIFY_TLS")


@lru_cache
def get_settings() -> Settings:
    return Settings()

