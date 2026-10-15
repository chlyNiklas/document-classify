from functools import lru_cache

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


@lru_cache
def get_settings() -> Settings:
    return Settings()

