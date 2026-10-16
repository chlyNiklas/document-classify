import json
from typing import Any, Literal

from koby_classify.classification.models import DsgFinding, ResponseLanguage


def build_assessment_request(
    text: str,
    *,
    assessment: Literal["isg_isv", "dsg"],
    system_prompt: str,
    deterministic_findings: list[DsgFinding] | None = None,
    validation_feedback: str | None = None,
    language: ResponseLanguage = ResponseLanguage.GERMAN,
    document_part: tuple[int, int] | None = None,
) -> dict[str, Any]:
    """Build the chat-completions payload shared by all LLM connectors.

    The produced payload contains ``messages`` and ``temperature``; the model
    identifier and any provider/transport specific settings are added by the
    calling connector.
    """
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

    return {
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
