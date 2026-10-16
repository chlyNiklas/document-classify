from __future__ import annotations

import asyncio
import mimetypes
from time import monotonic
from typing import Any

import httpx
from pydantic import ValidationError

from koby_classify.classification.models import ClassificationResponse
from koby_classify.evaluation.dataset import EvaluationCase


async def evaluate_cases(
    cases: list[EvaluationCase],
    *,
    endpoint: str,
    language: str,
    concurrency: int,
    timeout_seconds: float,
    access_token: str | None = None,
    transport: httpx.AsyncBaseTransport | None = None,
) -> list[dict[str, Any]]:
    semaphore = asyncio.Semaphore(concurrency)
    timeout = httpx.Timeout(timeout_seconds)
    async with httpx.AsyncClient(timeout=timeout, transport=transport) as client:
        tasks = [
            asyncio.create_task(
                _evaluate_case(
                    client,
                    semaphore,
                    case,
                    endpoint=endpoint,
                    language=language,
                    access_token=access_token,
                )
            )
            for case in cases
        ]
        results: list[dict[str, Any]] = []
        for task in asyncio.as_completed(tasks):
            result = await task
            results.append(result)
            marker = "ok" if result["status"] == "success" else "failed"
            print(f"[{len(results)}/{len(cases)}] {result['case_id']}: {marker}", flush=True)
    return sorted(results, key=lambda result: result["case_id"])


async def _evaluate_case(
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
    case: EvaluationCase,
    *,
    endpoint: str,
    language: str,
    access_token: str | None,
) -> dict[str, Any]:
    started_at = monotonic()
    result: dict[str, Any] = {
        "case_id": case.case_id,
        "document": str(case.document_path),
        "sha256": case.sha256,
        "expected_isg": case.expected_isg,
        "expected_dsg": case.expected_dsg,
        "annotation_status": case.annotation_status,
    }
    try:
        content = case.document_path.read_bytes()
        content_type = (
            mimetypes.guess_type(case.document_path.name)[0] or "application/octet-stream"
        )
        headers = {"Accept-Language": language}
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        async with semaphore:
            response = await client.post(
                endpoint,
                headers=headers,
                files={"file": (case.document_path.name, content, content_type)},
            )
        result["http_status"] = response.status_code
        if response.is_error:
            result.update(
                status="error",
                error=f"HTTP {response.status_code}: {_bounded_text(response.text)}",
            )
            return result

        prediction = ClassificationResponse.model_validate(response.json())
        result.update(
            status="success",
            prediction=prediction.model_dump(mode="json"),
        )
        return result
    except (OSError, httpx.HTTPError, ValueError, ValidationError) as error:
        result.update(status="error", error=f"{type(error).__name__}: {error}")
        return result
    finally:
        result["latency_seconds"] = round(monotonic() - started_at, 3)


def _bounded_text(value: str, limit: int = 1000) -> str:
    compact = " ".join(value.split())
    return compact if len(compact) <= limit else f"{compact[:limit]}..."
