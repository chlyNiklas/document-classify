from enum import StrEnum

from pydantic import BaseModel, Field


class ClassificationStatus(StrEnum):
    RECEIVED = "received"


class ClassificationRequest(BaseModel):
    text: str = Field(min_length=1)
    source: str | None = None
    context: dict[str, str] = Field(default_factory=dict)


class ClassificationResponse(BaseModel):
    status: ClassificationStatus

