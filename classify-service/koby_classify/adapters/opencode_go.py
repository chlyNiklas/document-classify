import json
from typing import Literal

import httpx

from koby_classify.adapters.base import ConnectorError
from koby_classify.adapters.prompts import build_assessment_request
from koby_classify.classification.models import DsgFinding, ResponseLanguage


class OpenCodeGoError(ConnectorError):
    pass


class OpenCodeGoClient:
    def __init__(
        self,
        *,
        url: str | None,
        api_key: str | None,
        model: str | None = None,
        timeout_seconds: float = 300.0,
        reasoning_effort: Literal["low", "medium", "high"] | None = "low",
    ) -> None:
        self._url = self._chat_completions_url(url)
        self._api_key = api_key
        self._model = model
        self._timeout_seconds = timeout_seconds
        self._reasoning_effort = reasoning_effort
        self._timeout = httpx.Timeout(timeout_seconds)

    @staticmethod
    def _chat_completions_url(url: str | None) -> str | None:
        if not url:
            return None
        normalized = url.rstrip("/")
        if normalized.endswith("/chat/completions"):
            return normalized
        return f"{normalized}/chat/completions"

    async def assess(
        self,
        text: str,
        *,
        assessment: Literal["isg_isv", "dsg"],
        system_prompt: str,
        deterministic_findings: list[DsgFinding] | None = None,
        validation_feedback: str | None = None,
        language: ResponseLanguage = ResponseLanguage.GERMAN,
        document_part: tuple[int, int] | None = None,
        session_id: str | None = None,
    ) -> str:
        if not all((self._url, self._api_key)):
            raise OpenCodeGoError(
                "KOBY_CLASSIFY_OPENCODE_API_KEY and KOBY_CLASSIFY_OPENCODE_BASE_URL "
                "must be configured"
            )

        payload = build_assessment_request(
            text,
            assessment=assessment,
            system_prompt=system_prompt,
            deterministic_findings=deterministic_findings,
            validation_feedback=validation_feedback,
            language=language,
            document_part=document_part,
        )
        payload["model"] = self._model or "glm-5.3-flash"
        if self._reasoning_effort:
            payload["reasoning_effort"] = self._reasoning_effort

        headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            "User-Agent": "koby-classify/0.1.0",
        }
        if session_id:
            headers["x-opencode-session"] = session_id

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                # The OpenCode Go gateway only answers streaming requests;
                # non-streaming chat completions hang until they time out.
                payload["stream"] = True
                async with client.stream(
                    "POST",
                    self._url,
                    headers=headers,
                    json=payload,
                ) as response:
                    response.raise_for_status()
                    content = await self._collect_stream_content(response)
        except httpx.HTTPStatusError as error:
            raise OpenCodeGoError(f"OpenCode returned HTTP {error.response.status_code}") from error
        except httpx.TimeoutException as error:
            raise OpenCodeGoError(
                f"OpenCode request timed out after {self._timeout_seconds:g} seconds"
            ) from error
        except httpx.ConnectError as error:
            raise OpenCodeGoError("Could not connect to OpenCode") from error
        except httpx.RequestError as error:
            raise OpenCodeGoError(f"OpenCode request failed ({type(error).__name__})") from error
        except httpx.HTTPError as error:
            raise OpenCodeGoError(f"OpenCode request failed ({type(error).__name__})") from error

        if not content.strip():
            raise OpenCodeGoError("OpenCode returned an empty response")
        return content.strip()

    async def _collect_stream_content(self, response: httpx.Response) -> str:
        """Aggregate an SSE chat-completion stream into the assistant text."""
        parts: list[str] = []
        try:
            async for line in response.aiter_lines():
                line = line.strip()
                if not line.startswith("data:"):
                    continue
                data = line[len("data:") :].strip()
                if data == "[DONE]":
                    break
                try:
                    chunk = json.loads(data)
                    choices = chunk.get("choices")
                    if not choices:
                        # Usage-only or keep-alive chunk without any choice.
                        continue
                    delta = choices[0].get("delta", {})
                    content_part = delta.get("content")
                except (KeyError, IndexError, TypeError, ValueError) as error:
                    raise OpenCodeGoError(
                        "OpenCode returned an unexpected response shape"
                    ) from error
                if isinstance(content_part, str):
                    parts.append(content_part)
        except OpenCodeGoError:
            raise
        except (KeyError, IndexError, TypeError, ValueError) as error:
            raise OpenCodeGoError("OpenCode returned an unexpected response shape") from error
        return "".join(parts)
