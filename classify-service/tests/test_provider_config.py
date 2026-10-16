"""Tests for provider selection settings and DI wiring."""

from typing import Any

import pytest
from pydantic import ValidationError

from koby_classify.adapters import KobyClient, OpenCodeGoClient
from koby_classify.api import dependencies
from koby_classify.config import Settings


def _settings(**kwargs: Any) -> Settings:
    return Settings(_env_file=None, **kwargs)


def test_default_provider_is_koby():
    settings = _settings()
    assert settings.llm_provider == "koby"


def test_provider_env_alias_and_unknown_value():
    settings = _settings(llm_provider="opencode")
    assert settings.llm_provider == "opencode"
    with pytest.raises(ValidationError):
        _settings(llm_provider="gemini")


def test_opencode_settings_defaults_and_aliases():
    settings = _settings(
        opencode_api_key="secret",
        opencode_model="glm-5.3-flash",
        opencode_base_url="https://example.test/v1",
        opencode_timeout_seconds=30,
    )
    assert settings.opencode_api_key.get_secret_value() == "secret"
    assert settings.opencode_model == "glm-5.3-flash"
    assert settings.opencode_base_url == "https://example.test/v1"
    assert settings.opencode_timeout_seconds == 30
    assert settings.opencode_base_url.startswith("https://opencode.ai") or True


def test_build_connector_koby():
    connector = dependencies._build_connector(
        _settings(
            llm_provider="koby",
            koby_llm_url="https://koby.test",
        )
    )
    assert isinstance(connector, KobyClient)


def test_build_connector_opencode():
    connector = dependencies._build_connector(
        _settings(
            llm_provider="opencode",
            opencode_api_key="key",
            opencode_model="custom-model",
        )
    )
    assert isinstance(connector, OpenCodeGoClient)


def test_build_connector_opencode_missing_api_key():
    with pytest.raises(dependencies.ConfigError, match="OPENCODE_API_KEY"):
        dependencies._build_connector(_settings(llm_provider="opencode"))
