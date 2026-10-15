import asyncio
import json
import ssl
from time import monotonic
from typing import Any, Literal

import httpx
import truststore

from koby_classify.classification.models import DsgFinding, ResponseLanguage


class KobyClientError(Exception):
    pass


class KobyClient:
    def __init__(
        self,
        *,
        url: str | None,
        token_url: str | None,
        client_id: str | None,
        client_secret: str | None,
        model: str | None = None,
        ca_bundle: str | None = None,
        verify_tls: bool = True,
        timeout_seconds: float = 60.0,
        reasoning_effort: Literal["low", "medium", "high"] | None = "low",
    ) -> None:
        self._url = self._chat_completions_url(url)
        self._token_url = token_url
        self._client_id = client_id
        self._client_secret = client_secret
        self._model = model
        self._timeout_seconds = timeout_seconds
        self._timeout = httpx.Timeout(timeout_seconds)
        self._reasoning_effort = reasoning_effort
        self._tls_verifier = self._create_tls_verifier(ca_bundle, verify_tls)
        self._access_token: str | None = None
        self._token_expires_at = 0.0
        self._token_lock = asyncio.Lock()

    @staticmethod
    def _chat_completions_url(url: str | None) -> str | None:
        if not url:
            return None
        normalized = url.rstrip("/")
        if normalized.endswith("/chat/completions"):
            return normalized
        return f"{normalized}/chat/completions"

    @staticmethod
    def _create_tls_verifier(
        ca_bundle: str | None,
        verify_tls: bool,
    ) -> ssl.SSLContext | bool:
        if not verify_tls:
            return False
        if ca_bundle:
            return ssl.create_default_context(cafile=ca_bundle)
        return truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)

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
    ) -> str:
        if not all((self._url, self._token_url, self._client_id, self._client_secret)):
            raise KobyClientError(
                "KOBY_LLM_URL, KOBY_TOKEN_URL, KOBY_CLIENT_ID, and "
                "KOBY_CLIENT_SECRET must be configured"
            )

        correction = ""
        if validation_feedback:
            correction = (
                "Der vorherige Ausgabeversuch war ungültig. Erzeuge die gesamte JSON-Antwort "
                "neu und korrigiere diese Validierungsfehler:\n"
                f"<validierungsfehler>{validation_feedback}</validierungsfehler>\n\n"
            )
        language_name = {
            ResponseLanguage.GERMAN: "Deutsch",
            ResponseLanguage.FRENCH: "Französisch",
            ResponseLanguage.ITALIAN: "Italienisch",
        }[language]
        canonical_fields = (
            "classification, category, profiling und high_risk_profiling"
            if assessment == "dsg"
            else "classification"
        )
        language_instruction = (
            f"Schreibe alle Einträge in den Feldern reasons auf {language_name} "
            f"(Sprachcode {language.value}). Die Werte in {canonical_fields} sind "
            "kanonische API-Werte und müssen "
            "unverändert aus dem vorgegebenen Schema übernommen werden.\n\n"
        )
        assessment_instruction = ""
        if assessment == "dsg":
            deterministic_findings_json = json.dumps(
                [finding.model_dump(mode="json") for finding in deterministic_findings or []],
                ensure_ascii=False,
            )
            assessment_instruction = (
                "Führe nur die DSG-Beurteilung aus. Die folgenden deterministischen "
                "Befunde wurden vom Service validiert und müssen berücksichtigt werden. "
                "Erfinde keine weiteren deterministischen Befunde.\n\n"
                "<deterministische-befunde>\n"
                f"{deterministic_findings_json}\n"
                "</deterministische-befunde>\n\n"
            )
        else:
            assessment_instruction = "Führe nur die ISG/ISV-Beurteilung aus.\n\n"

        part_instruction = ""
        if document_part and document_part[1] > 1:
            part_instruction = (
                f"Du analysierst Teil {document_part[0]} von {document_part[1]} des "
                "Dokuments. Beurteile die in diesem Teil vorhandenen Inhalte eigenständig; "
                "der Service führt die Teilresultate anschliessend zusammen.\n\n"
            )

        payload: dict[str, Any] = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": (
                        f"{correction}{language_instruction}{part_instruction}Analysiere den "
                        "Inhalt zwischen den Dokumentmarkierungen. "
                        f"{assessment_instruction}"
                        f"<dokument>\n{text}\n</dokument>"
                    ),
                },
            ],
            "temperature": 0,
        }
        if self._model:
            payload["model"] = self._model
        if self._reasoning_effort:
            payload["reasoning_effort"] = self._reasoning_effort

        try:
            async with httpx.AsyncClient(
                timeout=self._timeout,
                verify=self._tls_verifier,
            ) as client:
                access_token = await self._get_access_token(client)
                response = await client.post(
                    self._url,
                    headers={
                        "Accept": "application/json",
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                response.raise_for_status()
        except httpx.HTTPStatusError as error:
            raise KobyClientError(
                f"KOBY returned HTTP {error.response.status_code}"
            ) from error
        except httpx.TimeoutException as error:
            raise KobyClientError(
                f"KOBY request timed out after {self._timeout_seconds:g} seconds"
            ) from error
        except httpx.ConnectError as error:
            error_message = str(error).lower()
            if "certificate" in error_message:
                raise KobyClientError(
                    "KOBY TLS verification failed; configure KOBY_CA_BUNDLE or, for local "
                    "testing only, set KOBY_VERIFY_TLS=false"
                ) from error
            raise KobyClientError("Could not connect to KOBY") from error
        except httpx.RequestError as error:
            raise KobyClientError(
                f"KOBY request failed ({type(error).__name__})"
            ) from error
        except httpx.HTTPError as error:
            raise KobyClientError(
                f"KOBY request failed ({type(error).__name__})"
            ) from error

        try:
            body = response.json()
            content = body["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError, ValueError) as error:
            raise KobyClientError("KOBY returned an unexpected response shape") from error

        if not isinstance(content, str) or not content.strip():
            raise KobyClientError("KOBY returned an empty response")
        return content.strip()

    async def _get_access_token(self, client: httpx.AsyncClient) -> str:
        if self._access_token and monotonic() < self._token_expires_at:
            return self._access_token

        async with self._token_lock:
            if self._access_token and monotonic() < self._token_expires_at:
                return self._access_token

            response = await client.post(
                self._token_url,
                data={"grant_type": "client_credentials"},
                auth=httpx.BasicAuth(self._client_id, self._client_secret),
                headers={"Accept": "application/json"},
            )
            if response.is_error:
                raise KobyClientError(
                    f"KOBY token endpoint returned HTTP {response.status_code}"
                )

            try:
                token_data = response.json()
                access_token = token_data["access_token"]
            except (KeyError, TypeError, ValueError) as error:
                raise KobyClientError(
                    "KOBY token endpoint returned an unexpected response shape"
                ) from error

            if not isinstance(access_token, str) or not access_token.strip():
                raise KobyClientError("KOBY token endpoint returned an empty access token")

            try:
                lifetime = max(float(token_data.get("expires_in", 60)), 0)
            except (TypeError, ValueError):
                lifetime = 60
            refresh_margin = min(30, lifetime * 0.1)

            self._access_token = access_token.strip()
            self._token_expires_at = monotonic() + max(lifetime - refresh_margin, 0)
            return self._access_token
