import asyncio
import logging
from collections.abc import Iterable
from time import monotonic
from typing import Literal, TypeVar

from pydantic import BaseModel, ValidationError

from koby_classify.adapters.koby import KobyClient, KobyClientError
from koby_classify.classification.chunking import chunk_text
from koby_classify.classification.detectors import detect_structured_personal_data
from koby_classify.classification.models import (
    ClassificationRequest,
    ClassificationResponse,
    DataProtectionClassification,
    DataProtectionFindingCategory,
    DetectionStatus,
    DsgAssessment,
    DsgFinding,
    InformationClassification,
    IsgIsvAssessment,
    ResponseLanguage,
)


class ClassificationUnavailableError(Exception):
    pass


logger = logging.getLogger(__name__)
Assessment = TypeVar("Assessment", bound=BaseModel)
INFORMATION_SEVERITY = {
    InformationClassification.NOT_CLASSIFIED: 0,
    InformationClassification.INTERNAL: 1,
    InformationClassification.CONFIDENTIAL: 2,
    InformationClassification.SECRET: 3,
}
DATA_PROTECTION_SEVERITY = {
    DataProtectionClassification.NO_PERSONAL_DATA: 0,
    DataProtectionClassification.PERSONAL_DATA: 1,
    DataProtectionClassification.SENSITIVE_PERSONAL_DATA: 2,
}
FINDING_SEVERITY = {
    DataProtectionFindingCategory.PERSONAL_DATA: 0,
    DataProtectionFindingCategory.SENSITIVE_PERSONAL_DATA: 1,
}
DETECTION_SEVERITY = {
    DetectionStatus.NOT_DETECTED: 0,
    DetectionStatus.POSSIBLE: 1,
    DetectionStatus.DETECTED: 2,
}


class ClassificationService:
    def __init__(
        self,
        koby: KobyClient,
        *,
        isg_system_prompt: str,
        dsg_system_prompt: str,
        chunk_characters: int = 12_000,
    ) -> None:
        self._koby = koby
        self._isg_system_prompt = isg_system_prompt
        self._dsg_system_prompt = dsg_system_prompt
        self._chunk_characters = chunk_characters

    async def classify(
        self,
        request: ClassificationRequest,
        *,
        language: ResponseLanguage = ResponseLanguage.GERMAN,
    ) -> ClassificationResponse:
        started_at = monotonic()
        chunks = chunk_text(request.text, self._chunk_characters)
        deterministic_findings = detect_structured_personal_data(request.text)
        chunk_findings = [detect_structured_personal_data(chunk) for chunk in chunks]
        try:
            isg_results, dsg_results = await asyncio.gather(
                self._assess_chunks(
                    chunks=chunks,
                    assessment="isg_isv",
                    display_name="ISG/ISV",
                    system_prompt=self._isg_system_prompt,
                    schema=IsgIsvAssessment,
                    language=language,
                ),
                self._assess_chunks(
                    chunks=chunks,
                    assessment="dsg",
                    display_name="DSG",
                    system_prompt=self._dsg_system_prompt,
                    schema=DsgAssessment,
                    deterministic_findings_by_chunk=chunk_findings,
                    language=language,
                ),
                return_exceptions=True,
            )

            failures = [
                str(result)
                for result in (isg_results, dsg_results)
                if isinstance(result, BaseException)
            ]
            if failures:
                raise ClassificationUnavailableError(" | ".join(failures))

            if not isinstance(isg_results, list) or not all(
                isinstance(result, IsgIsvAssessment) for result in isg_results
            ):
                raise ClassificationUnavailableError(
                    "KOBY returned an unexpected ISG/ISV assessment result"
                )
            if not isinstance(dsg_results, list) or not all(
                isinstance(result, DsgAssessment) for result in dsg_results
            ):
                raise ClassificationUnavailableError(
                    "KOBY returned an unexpected DSG assessment result"
                )

            response = ClassificationResponse(
                isg_isv=self._aggregate_isg_assessments(isg_results),
                dsg=self._aggregate_dsg_assessments(dsg_results),
            )
            return self._merge_deterministic_findings(
                response,
                deterministic_findings,
                language,
            )
        finally:
            logger.info(
                "KOBY parallel assessments finished in %.2f seconds "
                "(document_characters=%s chunks=%s)",
                monotonic() - started_at,
                len(request.text),
                len(chunks),
            )

    async def _assess_chunks(
        self,
        *,
        chunks: list[str],
        assessment: Literal["isg_isv", "dsg"],
        display_name: str,
        system_prompt: str,
        schema: type[Assessment],
        language: ResponseLanguage,
        deterministic_findings_by_chunk: list[list[DsgFinding]] | None = None,
    ) -> list[Assessment]:
        results: list[Assessment] = []
        chunk_count = len(chunks)
        for index, chunk in enumerate(chunks):
            chunk_number = index + 1
            chunk_display_name = (
                f"{display_name} chunk {chunk_number}/{chunk_count}"
                if chunk_count > 1
                else display_name
            )
            deterministic_findings = (
                deterministic_findings_by_chunk[index]
                if deterministic_findings_by_chunk is not None
                else None
            )
            result = await self._assess(
                text=chunk,
                assessment=assessment,
                display_name=chunk_display_name,
                system_prompt=system_prompt,
                schema=schema,
                deterministic_findings=deterministic_findings,
                language=language,
                document_part=(chunk_number, chunk_count),
            )
            results.append(result)
        return results

    async def _assess(
        self,
        *,
        text: str,
        assessment: Literal["isg_isv", "dsg"],
        display_name: str,
        system_prompt: str,
        schema: type[Assessment],
        language: ResponseLanguage,
        deterministic_findings: list[DsgFinding] | None = None,
        document_part: tuple[int, int] | None = None,
    ) -> Assessment:
        started_at = monotonic()
        validation_feedback: str | None = None
        try:
            for attempt in range(2):
                try:
                    model_output = await self._koby.assess(
                        text,
                        assessment=assessment,
                        system_prompt=system_prompt,
                        deterministic_findings=deterministic_findings,
                        validation_feedback=validation_feedback,
                        language=language,
                        document_part=document_part,
                    )
                except KobyClientError as error:
                    raise ClassificationUnavailableError(
                        f"{display_name} assessment failed: {error}"
                    ) from error

                try:
                    return schema.model_validate_json(
                        self._strip_json_fence(model_output)
                    )
                except ValidationError as error:
                    validation_feedback = self._validation_feedback(error)

                logger.warning(
                    "KOBY %s assessment validation failed on attempt %s: %s",
                    display_name,
                    attempt + 1,
                    validation_feedback,
                )

            raise ClassificationUnavailableError(
                f"KOBY response does not satisfy the {display_name} schema after one "
                f"correction attempt: {validation_feedback}"
            )
        finally:
            logger.info(
                "KOBY %s assessment finished in %.2f seconds",
                display_name,
                monotonic() - started_at,
            )

    @staticmethod
    def _aggregate_isg_assessments(
        assessments: list[IsgIsvAssessment],
    ) -> IsgIsvAssessment:
        classification = max(
            (assessment.classification for assessment in assessments),
            key=INFORMATION_SEVERITY.__getitem__,
        )
        decisive = [
            assessment
            for assessment in assessments
            if assessment.classification is classification
        ]
        return IsgIsvAssessment(
            classification=classification,
            reasons=ClassificationService._unique_limited(
                (
                    reason
                    for assessment in decisive
                    for reason in assessment.reasons
                ),
                5,
            ),
            legal_basis=ClassificationService._unique_limited(
                (
                    reference
                    for assessment in decisive
                    for reference in assessment.legal_basis
                ),
                10,
            ),
        )

    @staticmethod
    def _aggregate_dsg_assessments(
        assessments: list[DsgAssessment],
    ) -> DsgAssessment:
        classification = max(
            (assessment.classification for assessment in assessments),
            key=DATA_PROTECTION_SEVERITY.__getitem__,
        )
        profiling = max(
            (assessment.profiling for assessment in assessments),
            key=DETECTION_SEVERITY.__getitem__,
        )
        high_risk_profiling = max(
            (assessment.high_risk_profiling for assessment in assessments),
            key=DETECTION_SEVERITY.__getitem__,
        )
        decisive = [
            assessment
            for assessment in assessments
            if assessment.classification is classification
        ]
        reason_sources = list(decisive)
        if profiling is not DetectionStatus.NOT_DETECTED:
            reason_sources.extend(
                assessment
                for assessment in assessments
                if assessment.profiling is profiling and assessment not in reason_sources
            )
        if high_risk_profiling is not DetectionStatus.NOT_DETECTED:
            reason_sources.extend(
                assessment
                for assessment in assessments
                if assessment.high_risk_profiling is high_risk_profiling
                and assessment not in reason_sources
            )

        findings_by_type: dict[str, DsgFinding] = {}
        for assessment in assessments:
            for finding in assessment.findings:
                existing = findings_by_type.get(finding.type)
                if existing is None:
                    findings_by_type[finding.type] = finding.model_copy(deep=True)
                    continue
                existing.count += finding.count
                if FINDING_SEVERITY[finding.category] > FINDING_SEVERITY[existing.category]:
                    existing.category = finding.category

        findings = sorted(
            findings_by_type.values(),
            key=lambda finding: (
                -FINDING_SEVERITY[finding.category],
                -finding.count,
                finding.type,
            ),
        )[:100]

        return DsgAssessment(
            classification=classification,
            reasons=ClassificationService._unique_limited(
                (
                    reason
                    for assessment in reason_sources
                    for reason in assessment.reasons
                ),
                5,
            ),
            legal_basis=ClassificationService._unique_limited(
                (
                    reference
                    for assessment in decisive
                    for reference in assessment.legal_basis
                ),
                10,
            ),
            findings=findings,
            profiling=profiling,
            high_risk_profiling=high_risk_profiling,
        )

    @staticmethod
    def _unique_limited(values: Iterable[str], limit: int) -> list[str]:
        unique: list[str] = []
        for value in values:
            if value not in unique:
                unique.append(value)
                if len(unique) == limit:
                    break
        return unique

    @staticmethod
    def _strip_json_fence(model_output: str) -> str:
        stripped = model_output.strip()
        if not stripped.startswith("```"):
            return stripped

        lines = stripped.splitlines()
        if lines and lines[0].strip().lower() in {"```", "```json"}:
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        return "\n".join(lines).strip()

    @staticmethod
    def _validation_feedback(error: ValidationError) -> str:
        messages: list[str] = []
        for detail in error.errors(include_input=False, include_url=False)[:8]:
            location = ".".join(str(part) for part in detail["loc"]) or "response"
            messages.append(f"{location}: {detail['msg']}")
        return "; ".join(messages)

    @staticmethod
    def _merge_deterministic_findings(
        response: ClassificationResponse,
        deterministic_findings: list[DsgFinding],
        language: ResponseLanguage,
    ) -> ClassificationResponse:
        if not deterministic_findings:
            return response

        findings_by_type = {finding.type: finding for finding in response.dsg.findings}
        for finding in deterministic_findings:
            existing = findings_by_type.get(finding.type)
            if existing is None:
                response.dsg.findings.append(finding)
                findings_by_type[finding.type] = finding
            else:
                existing.count = max(existing.count, finding.count)

        model_reported_no_personal_data = (
            response.dsg.classification is DataProtectionClassification.NO_PERSONAL_DATA
        )
        if model_reported_no_personal_data:
            response.dsg.classification = DataProtectionClassification.PERSONAL_DATA

        if "ahv_number" in findings_by_type:
            deterministic_reason = {
                ResponseLanguage.GERMAN: (
                    "Eine formal gültige AHV-Nummer wurde deterministisch erkannt; "
                    "sie ist ein Personenidentifikator."
                ),
                ResponseLanguage.FRENCH: (
                    "Un numéro AVS formellement valide a été détecté de manière "
                    "déterministe; il s'agit d'un identifiant personnel."
                ),
                ResponseLanguage.ITALIAN: (
                    "È stato rilevato in modo deterministico un numero AVS formalmente "
                    "valido; si tratta di un identificatore personale."
                ),
            }[language]
            if model_reported_no_personal_data:
                response.dsg.reasons = [deterministic_reason]
            elif deterministic_reason not in response.dsg.reasons:
                response.dsg.reasons = [
                    *response.dsg.reasons[:4],
                    deterministic_reason,
                ]
            reference = "Art. 5 Bst. a DSG"
            if reference not in response.dsg.legal_basis:
                response.dsg.legal_basis = [
                    *response.dsg.legal_basis[:9],
                    reference,
                ]

        try:
            return ClassificationResponse.model_validate(response.model_dump())
        except ValidationError as error:
            raise ClassificationUnavailableError(
                "Deterministic findings could not be merged into the DSG assessment"
            ) from error

