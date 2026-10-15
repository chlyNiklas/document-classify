import re

from koby_classify.classification.models import (
    DataProtectionFindingCategory,
    DsgFinding,
)


AHV_CANDIDATE_PATTERN = re.compile(r"(?<!\d)756(?:[.\s-]?\d){10}(?!\d)")


def detect_structured_personal_data(text: str) -> list[DsgFinding]:
    ahv_numbers = {
        digits
        for candidate in AHV_CANDIDATE_PATTERN.findall(text)
        if _is_valid_ahv_number(digits := re.sub(r"\D", "", candidate))
    }
    if not ahv_numbers:
        return []

    return [
        DsgFinding(
            type="ahv_number",
            category=DataProtectionFindingCategory.PERSONAL_DATA,
            count=len(ahv_numbers),
        )
    ]


def _is_valid_ahv_number(digits: str) -> bool:
    if len(digits) != 13 or not digits.startswith("756"):
        return False

    checksum_total = sum(
        int(digit) * (1 if index % 2 == 0 else 3)
        for index, digit in enumerate(digits[:12])
    )
    check_digit = (10 - checksum_total % 10) % 10
    return check_digit == int(digits[-1])
