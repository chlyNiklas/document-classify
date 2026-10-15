import re
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, model_validator


class InformationClassification(StrEnum):
    NOT_CLASSIFIED = "nicht klassifiziert"
    INTERNAL = "intern"
    CONFIDENTIAL = "vertraulich"
    SECRET = "geheim"


class DataProtectionClassification(StrEnum):
    NO_PERSONAL_DATA = "keine personendaten"
    PERSONAL_DATA = "personendaten"
    SENSITIVE_PERSONAL_DATA = "besonders schützenswerte personendaten"


class DataProtectionFindingCategory(StrEnum):
    PERSONAL_DATA = "personendaten"
    SENSITIVE_PERSONAL_DATA = "besonders schützenswerte personendaten"


class DetectionStatus(StrEnum):
    NOT_DETECTED = "nicht erkannt"
    POSSIBLE = "möglich"
    DETECTED = "erkannt"


class ResponseLanguage(StrEnum):
    GERMAN = "de"
    FRENCH = "fr"
    ITALIAN = "it"


class ClassificationRequest(BaseModel):
    text: str = Field(min_length=1)
    source: str | None = None
    context: dict[str, str] = Field(default_factory=dict)


class IsgIsvAssessment(BaseModel):
    model_config = ConfigDict(extra="forbid")

    classification: InformationClassification
    reasons: list[str] = Field(min_length=1, max_length=5)
    legal_basis: list[str] = Field(min_length=1, max_length=10)

    @model_validator(mode="after")
    def validate_isg_isv_contract(self) -> "IsgIsvAssessment":
        references = " ".join(self.legal_basis)
        if not re.search(r"Art\.\s*\d+", references) or not re.search(
            r"\b(?:ISG|ISV)\b", references
        ):
            raise ValueError("legal_basis must cite an ISG or ISV article")

        if self.classification is InformationClassification.SECRET:
            reasons = " ".join(self.reasons)
            if "Eskalation" not in reasons or not re.search(
                r"Art\.\s*24\s+ISV", references
            ):
                raise ValueError("geheim requires escalation and an Art. 24 ISV reference")

        return self


class DsgFinding(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: str = Field(min_length=1, max_length=100, pattern=r"^[a-z0-9_]+$")
    category: DataProtectionFindingCategory
    count: int = Field(ge=1)


class DsgAssessment(BaseModel):
    model_config = ConfigDict(extra="forbid")

    classification: DataProtectionClassification
    reasons: list[str] = Field(min_length=1, max_length=5)
    legal_basis: list[str] = Field(min_length=1, max_length=10)
    findings: list[DsgFinding] = Field(default_factory=list, max_length=100)
    profiling: DetectionStatus
    high_risk_profiling: DetectionStatus

    @model_validator(mode="after")
    def validate_dsg_contract(self) -> "DsgAssessment":
        references = " ".join(self.legal_basis)
        if not re.search(r"Art\.\s*\d+", references) or not re.search(
            r"\bDSG\b", references
        ):
            raise ValueError("legal_basis must cite a DSG article")

        if self.classification is DataProtectionClassification.NO_PERSONAL_DATA:
            if self.findings:
                raise ValueError("keine personendaten cannot contain findings")
            if self.profiling is not DetectionStatus.NOT_DETECTED:
                raise ValueError("profiling requires personal data")
            if self.high_risk_profiling is not DetectionStatus.NOT_DETECTED:
                raise ValueError("high-risk profiling requires personal data")
        elif not self.findings:
            raise ValueError("a personal-data classification requires at least one finding")

        if self.classification is DataProtectionClassification.SENSITIVE_PERSONAL_DATA:
            if not any(
                finding.category
                is DataProtectionFindingCategory.SENSITIVE_PERSONAL_DATA
                for finding in self.findings
            ):
                raise ValueError(
                    "besonders schützenswerte personendaten requires a sensitive finding"
                )
        elif any(
            finding.category is DataProtectionFindingCategory.SENSITIVE_PERSONAL_DATA
            for finding in self.findings
        ):
            raise ValueError("a sensitive finding requires the sensitive classification")

        if (
            self.high_risk_profiling is DetectionStatus.DETECTED
            and self.profiling is not DetectionStatus.DETECTED
        ):
            raise ValueError("detected high-risk profiling requires detected profiling")
        if (
            self.high_risk_profiling is DetectionStatus.POSSIBLE
            and self.profiling is DetectionStatus.NOT_DETECTED
        ):
            raise ValueError("possible high-risk profiling requires possible profiling")

        return self


class ClassificationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    isg_isv: IsgIsvAssessment
    dsg: DsgAssessment

