"""Tests that ClassificationService generates one session id per classify() run."""

import asyncio
import json
import uuid

from koby_classify.classification.models import ClassificationRequest
from koby_classify.classification.service import ClassificationService


class _FakeConnector:
    def __init__(self) -> None:
        self.calls: list[dict] = []

    async def assess(self, text, **kwargs):  # noqa: ANN001
        self.calls.append(kwargs)
        assessment = kwargs["assessment"]
        if assessment == "isg_isv":
            payload = {
                "classification": "internal",
                "reasons": ["r"],
                "legal_basis": ["Art. 10 ISG"],
            }
        else:
            payload = {
                "classification": "no_personal_data",
                "reasons": ["r"],
                "legal_basis": ["Art. 5 DSG"],
                "findings": [],
                "profiling": "nicht erkannt",
                "high_risk_profiling": "nicht erkannt",
            }
        return json.dumps(payload)


def _service() -> tuple[ClassificationService, _FakeConnector]:
    connector = _FakeConnector()
    service = ClassificationService(
        connector,
        isg_system_prompt="ISG",
        dsg_system_prompt="DSG",
    )
    return service, connector


def test_session_id_stable_within_run_and_varies_between_runs():
    service, connector = _service()
    request = ClassificationRequest(text="Inhalt " * 10)

    asyncio.run(service.classify(request))
    first_ids = {call["session_id"] for call in connector.calls}
    assert len(first_ids) == 1
    first_session = first_ids.pop()
    assert isinstance(first_session, str)
    uuid.UUID(first_session)  # valid UUID
    # more than one assess call (isg + dsg) share the same session id
    assert len(connector.calls) >= 2

    asyncio.run(service.classify(request))
    second_ids = {call["session_id"] for call in connector.calls[len(connector.calls) // 2 :]}
    second_session = second_ids.pop()
    assert second_session != first_session
