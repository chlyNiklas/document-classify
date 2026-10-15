from enum import StrEnum
import re

from pydantic import BaseModel, ConfigDict, Field, model_validator


class InformationClassification(StrEnum):
    NOT_CLASSIFIED = "nicht klassifiziert"
    INTERNAL = "intern"
    CONFIDENTIAL = "vertraulich"
    SECRET = "geheim"


class ClassificationRequest(BaseModel):
    text: str = Field(min_length=1)
    source: str | None = None
    context: dict[str, str] = Field(default_factory=dict)


class ClassificationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    klassifizierung: InformationClassification
    begruendung: str = Field(min_length=1, max_length=2_000)

    @model_validator(mode="after")
    def validate_rulebook_contract(self) -> "ClassificationResponse":
        if not re.search(r"Art\.\s*\d+", self.begruendung) or not re.search(
            r"\b(?:ISG|ISV)\b", self.begruendung
        ):
            raise ValueError("begruendung must cite an ISG or ISV article")

        sentence_count = len(re.split(r"(?<=[.!?])\s+(?=[A-ZÄÖÜ])", self.begruendung))
        if sentence_count > 5:
            raise ValueError("begruendung must contain at most five sentences")

        if self.klassifizierung is InformationClassification.SECRET:
            if "Eskalation" not in self.begruendung or not re.search(
                r"Art\.\s*24\s+ISV", self.begruendung
            ):
                raise ValueError("geheim requires the Art. 24 ISV escalation notice")

        return self

