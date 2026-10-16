"""Tests for the LLM connector seam (adapters/base.py, koby.py, opencode_go.py)."""

import asyncio
import json
from typing import Any

import httpx
import pytest

from koby_classify.adapters.base import (
    AssessConnector,
    ConnectorError,
)
from koby_classify.adapters.koby import KobyClient, KobyClientError
from koby_classify.adapters.opencode_go import OpenCodeGoClient, OpenCodeGoError
from koby_classify.adapters.prompts import build_assessment_request
from koby_classify.classification.models import DsgFinding, ResponseLanguage


def _chat_response(content: str = '{"classification": "internal"}') -> httpx.Response:
    return httpx.Response(
        200,
        json={"choices": [{"message": {"content": content}}]},
        request=httpx.Request("POST", "https://example.test/chat/completions"),
    )


def _sse_body(content: str, *, done: bool = True) -> str:
    lines = [
        'data: {"choices": [{"index": 0, "delta": {"role": "assistant", "content": ""}}]}',
        f"data: {json.dumps({'choices': [{'index': 0, 'delta': {'content': content}}]})}",
    ]
    if done:
        lines.append("data: [DONE]")
    return "\n\n".join(lines) + "\n"


def _koby_client(**kwargs: Any) -> KobyClient:
    defaults: dict[str, Any] = {
        "url": "https://example.test",
        "token_url": "https://example.test/token",
        "client_id": "id",
        "client_secret": "secret",
    }
    defaults.update(kwargs)
    return KobyClient(**defaults)


def _patch_opencode_transport(monkeypatch: pytest.MonkeyPatch, handler) -> list[httpx.Request]:
    """Patch httpx.AsyncClient used by opencode_go with a MockTransport."""
    import koby_classify.adapters.opencode_go as module

    requests: list[httpx.Request] = []

    def recording_handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return handler(request)

    original = module.httpx.AsyncClient

    def patched(**kwargs: Any):
        kwargs["transport"] = httpx.MockTransport(recording_handler)
        return original(**kwargs)

    monkeypatch.setattr(module.httpx, "AsyncClient", patched)
    return requests


# --- Connector seam ---------------------------------------------------------


def test_koby_client_conforms_to_assess_connector_protocol():
    assert isinstance(_koby_client(), AssessConnector)


def test_opencode_client_conforms_to_assess_connector_protocol():
    assert isinstance(OpenCodeGoClient(url="https://example.test", api_key="key"), AssessConnector)


def test_connector_error_is_base_of_provider_errors():
    assert issubclass(KobyClientError, ConnectorError)
    assert issubclass(OpenCodeGoError, ConnectorError)


# --- Shared prompt assembly --------------------------------------------------


def test_build_assessment_request_isg_payload():
    payload = build_assessment_request(
        "Dokumenttext",
        assessment="isg_isv",
        system_prompt="SYSTEM",
        language=ResponseLanguage.GERMAN,
        document_part=(2, 3),
    )
    assert payload["temperature"] == 0
    assert payload["messages"][0] == {"role": "system", "content": "SYSTEM"}
    user = payload["messages"][1]["content"]
    assert "Teil 2 von 3" in user
    assert "<dokument>\nDokumenttext\n</dokument>" in user
    assert "ISG/ISV-Beurteilung" in user


def test_build_assessment_request_dsg_includes_deterministic_findings():
    finding = DsgFinding(type="ahv_number", category="personendaten", count=2)
    payload = build_assessment_request(
        "T",
        assessment="dsg",
        system_prompt="S",
        deterministic_findings=[finding],
        validation_feedback="reasons: missing",
    )
    user = payload["messages"][1]["content"]
    assert "ahv_number" in user
    assert "<validierungsfehler>reasons: missing</validierungsfehler>" in user


# --- KobyClient golden payload ------------------------------------------------


def test_koby_assess_payload_matches_shared_builder(monkeypatch: pytest.MonkeyPatch):
    chat_response = _chat_response()
    requests: list[httpx.Request] = []

    class FakeAsyncClient:
        def __init__(self, **kwargs: Any) -> None:
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args: Any):
            return None

        async def post(self, url, **kwargs: Any):  # noqa: ANN001
            request = httpx.Request("POST", url, **kwargs)
            requests.append(request)
            return chat_response

    monkeypatch.setattr(
        "koby_classify.adapters.koby.httpx.AsyncClient",
        FakeAsyncClient,
    )
    monkeypatch.setattr(KobyClient, "_get_access_token", async_token_stub, raising=False)

    client = _koby_client(model="koby-model", reasoning_effort="low")
    result = asyncio.run(
        client.assess(
            "T",
            assessment="dsg",
            system_prompt="SYS",
            deterministic_findings=[DsgFinding(type="email", category="personendaten", count=1)],
            language=ResponseLanguage.GERMAN,
            document_part=(1, 1),
            session_id="ignored-by-koby",
        )
    )
    assert result == '{"classification": "internal"}'
    assert "Authorization" in requests[0].headers
    body = json.loads(requests[0].content)
    expected = build_assessment_request(
        "T",
        assessment="dsg",
        system_prompt="SYS",
        deterministic_findings=[DsgFinding(type="email", category="personendaten", count=1)],
        language=ResponseLanguage.GERMAN,
        document_part=(1, 1),
    )
    expected["model"] = "koby-model"
    expected["reasoning_effort"] = "low"
    assert body == expected


async def async_token_stub(self, client):  # noqa: ANN001
    return "tok"


# --- OpenCode Go client -------------------------------------------------------


def test_opencode_assess_success_headers_and_url(monkeypatch: pytest.MonkeyPatch):
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200, text=_sse_body('{"classification": "internal"}'), request=request
        )

    requests = _patch_opencode_transport(monkeypatch, handler)
    client = OpenCodeGoClient(
        url="https://opencode.test/inference/go/openai/v1",
        api_key="secret-key",
        model="glm-5.3-flash",
        timeout_seconds=5,
    )
    result = asyncio.run(
        client.assess("T", assessment="isg_isv", system_prompt="SYS", session_id="session-1")
    )

    assert result == '{"classification": "internal"}'
    request = requests[0]
    assert request.url == "https://opencode.test/inference/go/openai/v1/chat/completions"
    assert request.headers["Authorization"] == "Bearer secret-key"
    assert request.headers["x-opencode-session"] == "session-1"
    assert request.headers["user-agent"].startswith("koby-classify/")
    assert json.loads(request.content)["model"] == "glm-5.3-flash"


def test_opencode_default_model_when_none_configured(monkeypatch: pytest.MonkeyPatch):
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200, text=_sse_body('{"classification": "internal"}'), request=request
        )

    requests = _patch_opencode_transport(monkeypatch, handler)
    client = OpenCodeGoClient(url="https://opencode.test", api_key="k")
    asyncio.run(client.assess("T", assessment="isg_isv", system_prompt="S"))
    assert json.loads(requests[0].content)["model"] == "glm-5.3-flash"


def test_opencode_session_header_stable_across_calls(monkeypatch: pytest.MonkeyPatch):
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200, text=_sse_body('{"classification": "internal"}'), request=request
        )

    requests = _patch_opencode_transport(monkeypatch, handler)
    client = OpenCodeGoClient(url="https://opencode.test", api_key="k")
    asyncio.run(client.assess("T", assessment="isg_isv", system_prompt="S", session_id="s1"))
    asyncio.run(client.assess("T", assessment="dsg", system_prompt="S", session_id="s1"))
    assert [r.headers["x-opencode-session"] for r in requests] == ["s1", "s1"]


def test_opencode_http_error_includes_status(monkeypatch: pytest.MonkeyPatch):
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(429, request=request)

    _patch_opencode_transport(monkeypatch, handler)
    client = OpenCodeGoClient(url="https://opencode.test", api_key="k")
    with pytest.raises(OpenCodeGoError, match="HTTP 429"):
        asyncio.run(client.assess("T", assessment="isg_isv", system_prompt="S"))


def test_opencode_empty_content_raises(monkeypatch: pytest.MonkeyPatch):
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text=_sse_body("   "), request=request)

    _patch_opencode_transport(monkeypatch, handler)
    client = OpenCodeGoClient(url="https://opencode.test", api_key="k")
    with pytest.raises(OpenCodeGoError, match="empty response"):
        asyncio.run(client.assess("T", assessment="isg_isv", system_prompt="S"))


def test_opencode_unexpected_shape_raises(monkeypatch: pytest.MonkeyPatch):
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text="data: not-json\n\n", request=request)

    _patch_opencode_transport(monkeypatch, handler)
    client = OpenCodeGoClient(url="https://opencode.test", api_key="k")
    with pytest.raises(OpenCodeGoError, match="unexpected response shape"):
        asyncio.run(client.assess("T", assessment="isg_isv", system_prompt="S"))


def test_opencode_requests_streaming(monkeypatch: pytest.MonkeyPatch):
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200, text=_sse_body('{"classification": "internal"}'), request=request
        )

    requests = _patch_opencode_transport(monkeypatch, handler)
    client = OpenCodeGoClient(url="https://opencode.test", api_key="k")
    asyncio.run(client.assess("T", assessment="isg_isv", system_prompt="S"))
    assert json.loads(requests[0].content)["stream"] is True


def test_opencode_missing_config_raises_before_request():
    client = OpenCodeGoClient(url=None, api_key=None)
    with pytest.raises(OpenCodeGoError, match="OPENCODE_API_KEY"):
        asyncio.run(client.assess("T", assessment="isg_isv", system_prompt="S"))


def test_opencode_timeout_raises(monkeypatch: pytest.MonkeyPatch):
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectTimeout("timed out", request=request)

    _patch_opencode_transport(monkeypatch, handler)
    client = OpenCodeGoClient(url="https://opencode.test", api_key="k", timeout_seconds=1)
    with pytest.raises(OpenCodeGoError, match="timed out"):
        asyncio.run(client.assess("T", assessment="isg_isv", system_prompt="S"))
