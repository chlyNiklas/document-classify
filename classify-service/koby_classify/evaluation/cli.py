from __future__ import annotations

import argparse
import asyncio
import json
import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from koby_classify.evaluation.dataset import DatasetError, LoadedDataset, load_dataset
from koby_classify.evaluation.metrics import build_report_summary
from koby_classify.evaluation.runner import evaluate_cases

DEFAULT_DATASET_ROOT = Path(__file__).resolve().parents[3] / "ground_truth"


def main(argv: list[str] | None = None) -> int:
    parser = _parser()
    args = parser.parse_args(argv)
    try:
        dataset = load_dataset(args.dataset)
    except DatasetError as error:
        parser.error(str(error))

    cases = dataset.cases
    if args.case:
        selected_ids = set(args.case)
        cases = [case for case in cases if case.case_id in selected_ids]
        missing = sorted(selected_ids - {case.case_id for case in cases})
        if missing:
            parser.error(f"Unknown case ids: {', '.join(missing)}")
    if args.limit is not None:
        cases = cases[: args.limit]

    _print_dataset_summary(dataset, selected=len(cases))
    if args.validate_only:
        return 0
    if not cases:
        parser.error("No cases selected")

    results = asyncio.run(
        evaluate_cases(
            cases,
            endpoint=args.endpoint,
            language=args.language,
            concurrency=args.concurrency,
            timeout_seconds=args.timeout,
            access_token=os.environ.get("KOBY_CLASSIFY_EVALUATION_TOKEN"),
        )
    )
    report = _build_report(dataset, args, results)
    output = args.output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    _print_result_summary(report["summary"], output)
    return 1 if report["summary"]["operational"]["failed_cases"] else 0


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Evaluate the Document Classify HTTP API against the local ground-truth corpus."
    )
    parser.add_argument(
        "--dataset",
        type=Path,
        default=DEFAULT_DATASET_ROOT,
        help=f"Dataset root (default: {DEFAULT_DATASET_ROOT})",
    )
    parser.add_argument(
        "--endpoint",
        default="http://127.0.0.1:8000/v1/classify",
        help="Complete classification endpoint URL",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("evaluation-results/latest.json"),
        help="JSON report path",
    )
    parser.add_argument("--language", choices=("de", "fr", "it"), default="de")
    parser.add_argument("--concurrency", type=_positive_int, default=2)
    parser.add_argument("--timeout", type=_positive_float, default=180.0)
    parser.add_argument("--limit", type=_positive_int)
    parser.add_argument("--case", action="append", help="Evaluate only this case id; repeatable")
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help=(
            "Inspect annotations, documents, hashes, and scoreable-label coverage without "
            "HTTP calls"
        ),
    )
    return parser


def _build_report(
    dataset: LoadedDataset, args: argparse.Namespace, results: list[dict[str, Any]]
) -> dict[str, Any]:
    return {
        "schema_version": "1.0",
        "generated_at": datetime.now(UTC).isoformat(),
        "configuration": {
            "endpoint": args.endpoint,
            "language": args.language,
            "concurrency": args.concurrency,
            "timeout_seconds": args.timeout,
            "authenticated": bool(os.environ.get("KOBY_CLASSIFY_EVALUATION_TOKEN")),
        },
        "dataset": dataset.summary(),
        "summary": build_report_summary(results),
        "results": results,
    }


def _print_dataset_summary(dataset: LoadedDataset, *, selected: int) -> None:
    summary = dataset.summary()
    print(
        "Dataset: "
        f"{summary['discovered_cases']} discovered, {selected} selected, "
        f"{summary['scoreable_isg_cases']} ISG-scoreable, "
        f"{summary['scoreable_dsg_cases']} DSG-scoreable"
    )
    print(f"ISG targets: {summary['expected_isg_distribution']}")
    for warning in summary["warnings"]:
        print(f"WARNING: {warning}")


def _print_result_summary(summary: dict[str, Any], output: Path) -> None:
    operational = summary["operational"]
    isg = summary["isg"]
    print(
        f"Completed: {operational['successful_cases']}/{operational['total_cases']} successful; "
        f"{operational['failed_cases']} failed"
    )
    print(
        f"ISG: {isg['scoreable_cases']} scored, accuracy={isg['accuracy']:.3f}, "
        f"macro_f1={isg['macro_f1']:.3f}, under={isg['under_classifications']}, "
        f"over={isg['over_classifications']}"
    )
    print(f"Report: {output}")


def _positive_int(value: str) -> int:
    parsed = int(value)
    if parsed <= 0:
        raise argparse.ArgumentTypeError("must be greater than zero")
    return parsed


def _positive_float(value: str) -> float:
    parsed = float(value)
    if parsed <= 0:
        raise argparse.ArgumentTypeError("must be greater than zero")
    return parsed
