"""Ground-truth evaluation support for the classification API."""

from koby_classify.evaluation.dataset import EvaluationCase, load_dataset
from koby_classify.evaluation.metrics import build_report_summary

__all__ = ["EvaluationCase", "build_report_summary", "load_dataset"]
