from __future__ import annotations

from collections import Counter
from statistics import mean, median
from typing import Any


ISG_ORDER = ["unclassified", "internal", "confidential", "secret"]
DSG_ORDER = [
    "no_personal_data",
    "personal_data",
    "sensitive_personal_data",
]


def build_report_summary(results: list[dict[str, Any]]) -> dict[str, Any]:
    successful = [result for result in results if result.get("status") == "success"]
    latencies = sorted(
        float(result["latency_seconds"])
        for result in results
        if isinstance(result.get("latency_seconds"), int | float)
    )
    isg_predictions = Counter(
        _nested(result, "prediction", "isg_isv", "classification")
        for result in successful
    )
    dsg_predictions = Counter(
        _nested(result, "prediction", "dsg", "classification") for result in successful
    )
    finding_types = Counter(
        finding.get("type")
        for result in successful
        for finding in (_nested(result, "prediction", "dsg", "findings") or [])
        if isinstance(finding, dict) and isinstance(finding.get("type"), str)
    )

    summary: dict[str, Any] = {
        "operational": {
            "total_cases": len(results),
            "successful_cases": len(successful),
            "failed_cases": len(results) - len(successful),
            "success_rate": _safe_divide(len(successful), len(results)),
            "latency_seconds": _latency_summary(latencies),
        },
        "predictions": {
            "isg_distribution": _clean_counter(isg_predictions),
            "dsg_distribution": _clean_counter(dsg_predictions),
            "dsg_finding_types": _clean_counter(finding_types),
        },
        "isg": _classification_metrics(successful, "isg_isv", ISG_ORDER),
        "dsg": _classification_metrics(successful, "dsg", DSG_ORDER),
    }
    return summary


def _classification_metrics(
    successful: list[dict[str, Any]], assessment: str, labels: list[str]
) -> dict[str, Any]:
    expected_key = f"expected_{'isg' if assessment == 'isg_isv' else 'dsg'}"
    scored: list[tuple[str, str]] = []
    for result in successful:
        expected = result.get(expected_key)
        predicted = _nested(result, "prediction", assessment, "classification")
        if isinstance(expected, str) and isinstance(predicted, str):
            scored.append((expected, predicted))

    confusion = {
        expected: {predicted: 0 for predicted in labels}
        for expected in labels
    }
    for expected, predicted in scored:
        if expected in confusion and predicted in confusion[expected]:
            confusion[expected][predicted] += 1

    per_label: dict[str, Any] = {}
    f1_values: list[float] = []
    for label in labels:
        true_positive = confusion[label][label]
        false_positive = sum(confusion[other][label] for other in labels if other != label)
        false_negative = sum(confusion[label][other] for other in labels if other != label)
        support = sum(confusion[label].values())
        precision = _safe_divide(true_positive, true_positive + false_positive)
        recall = _safe_divide(true_positive, true_positive + false_negative)
        f1 = _safe_divide(2 * precision * recall, precision + recall)
        if support:
            f1_values.append(f1)
        per_label[label] = {
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "support": support,
        }

    exact_matches = sum(expected == predicted for expected, predicted in scored)
    ordinal_errors = [
        labels.index(predicted) - labels.index(expected)
        for expected, predicted in scored
        if expected in labels and predicted in labels
    ]
    return {
        "scoreable_cases": len(scored),
        "accuracy": _safe_divide(exact_matches, len(scored)),
        "macro_f1": mean(f1_values) if f1_values else 0.0,
        "under_classifications": sum(error < 0 for error in ordinal_errors),
        "over_classifications": sum(error > 0 for error in ordinal_errors),
        "mean_absolute_level_error": (
            mean(abs(error) for error in ordinal_errors) if ordinal_errors else 0.0
        ),
        "per_label": per_label,
        "confusion_matrix": confusion,
    }


def _latency_summary(latencies: list[float]) -> dict[str, float | None]:
    if not latencies:
        return {"mean": None, "median": None, "p95": None, "max": None}
    return {
        "mean": mean(latencies),
        "median": median(latencies),
        "p95": _percentile(latencies, 0.95),
        "max": max(latencies),
    }


def _percentile(values: list[float], percentile: float) -> float:
    index = max(0, min(len(values) - 1, int(len(values) * percentile + 0.999999) - 1))
    return values[index]


def _safe_divide(numerator: float, denominator: float) -> float:
    return numerator / denominator if denominator else 0.0


def _clean_counter(counter: Counter[Any]) -> dict[str, int]:
    return {
        str(key): value
        for key, value in sorted(counter.items(), key=lambda item: str(item[0]))
        if key is not None
    }


def _nested(value: dict[str, Any], *keys: str) -> Any:
    current: Any = value
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current
