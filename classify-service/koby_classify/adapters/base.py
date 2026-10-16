from typing import Literal, Protocol, runtime_checkable

from koby_classify.classification.models import DsgFinding, ResponseLanguage


class ConnectorError(Exception):
    """Base class for errors raised by LLM connectors."""


@runtime_checkable
class AssessConnector(Protocol):
    """Structural protocol every LLM connector must satisfy."""

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
    ) -> str: ...
