import logging

from pydantic import ValidationError

from koby_classify.adapters.koby import KobyClient, KobyClientError
from koby_classify.classification.detectors import detect_structured_personal_data
from koby_classify.classification.models import (
    ClassificationRequest,
    ClassificationResponse,
    DataProtectionClassification,
    DsgFinding,
    ResponseLanguage,
)


class ClassificationUnavailableError(Exception):
    pass


logger = logging.getLogger(__name__)


class ClassificationService:
    def __init__(self, koby: KobyClient) -> None:
        self._koby = koby

    async def classify(
        self,
        request: ClassificationRequest,
        *,
        language: ResponseLanguage = ResponseLanguage.GERMAN,
    ) -> ClassificationResponse:
        deterministic_findings = detect_structured_personal_data(request.text)
        validation_feedback: str | None = None

        for attempt in range(2):
            try:
                model_output = await self._koby.classify(
                    request.text,
                    deterministic_findings=deterministic_findings,
                    validation_feedback=validation_feedback,
                    language=language,
                )
            except KobyClientError as error:
                raise ClassificationUnavailableError(str(error)) from error

            try:
                response = ClassificationResponse.model_validate_json(
                    self._strip_json_fence(model_output)
                )
                return self._merge_deterministic_findings(
                    response,
                    deterministic_findings,
                    language,
                )
            except ValidationError as error:
                validation_feedback = self._validation_feedback(error)
            except ClassificationUnavailableError as error:
                validation_feedback = str(error)

            logger.warning(
                "KOBY assessment validation failed on attempt %s: %s",
                attempt + 1,
                validation_feedback,
            )

        raise ClassificationUnavailableError(
            "KOBY response does not satisfy the ISG/ISV and DSG schema after one "
            f"correction attempt: {validation_feedback}"
        )

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

