import tempfile
import unittest
from pathlib import Path

import httpx

from koby_classify.evaluation.dataset import load_dataset
from koby_classify.evaluation.metrics import build_report_summary
from koby_classify.evaluation.runner import evaluate_cases

VALID_RESPONSE = {
    "isg_isv": {
        "classification": "internal",
        "reasons": ["Begrenzte Beeinträchtigung eines wichtigen Prozesses."],
        "legal_basis": ["Art. 18 ISV"],
    },
    "dsg": {
        "classification": "no_personal_data",
        "reasons": ["Keine Angaben zu einer bestimmbaren natürlichen Person."],
        "legal_basis": ["Art. 5 DSG"],
        "findings": [],
        "profiling": "nicht erkannt",
        "high_risk_profiling": "nicht erkannt",
    },
}


class DatasetTests(unittest.TestCase):
    def test_discovers_cases_missing_from_manifest_and_extracts_scoreable_label(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "documents").mkdir()
            (root / "ground_truth").mkdir()
            (root / "documents" / "GT-0121_DOC-01.txt").write_text("test", encoding="utf-8")
            (root / "ground_truth" / "GT-0121.yaml").write_text(
                """
schema_version: '1.2'
test_id: GT-0121
document:
  filename: GT-0121_DOC-01.txt
information_security:
  expected_classification: VERTRAULICH
  assessment_status: proposed_pending_legal_review
""".strip(),
                encoding="utf-8",
            )
            (root / "manifest.yaml").write_text(
                "total_documents: 0\ndocuments: []\n", encoding="utf-8"
            )

            dataset = load_dataset(root)

            self.assertEqual(len(dataset.cases), 1)
            self.assertEqual(dataset.cases[0].expected_isg, "confidential")
            self.assertIn("1 discovered cases are absent from manifest", dataset.warnings[-1])

    def test_old_provisional_proposal_is_not_scored(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "documents").mkdir()
            (root / "ground_truth").mkdir()
            (root / "documents" / "GT-0001_DOC-01.txt").write_text("test", encoding="utf-8")
            (root / "ground_truth" / "GT-0001.yaml").write_text(
                """
case_id: GT-0001
document:
  filename: GT-0001_DOC-01.txt
isv_expected_classification_proposal:
  status: PROVISIONAL_NOT_LEGAL_GROUND_TRUTH
  classification: not_classified
""".strip(),
                encoding="utf-8",
            )

            dataset = load_dataset(root)

            self.assertIsNone(dataset.cases[0].expected_isg)


class RunnerTests(unittest.IsolatedAsyncioTestCase):
    async def test_runs_case_through_http_contract_and_scores_it(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "documents").mkdir()
            (root / "ground_truth").mkdir()
            (root / "documents" / "GT-0101_DOC-01.txt").write_text("test", encoding="utf-8")
            (root / "ground_truth" / "GT-0101.yaml").write_text(
                """
test_id: GT-0101
document:
  filename: GT-0101_DOC-01.txt
information_security:
  expected_classification: INTERN
""".strip(),
                encoding="utf-8",
            )
            case = load_dataset(root).cases[0]

            async def handler(request: httpx.Request) -> httpx.Response:
                self.assertEqual(request.headers["accept-language"], "de")
                self.assertEqual(request.headers["authorization"], "Bearer test-token")
                self.assertIn(b'filename="GT-0101_DOC-01.txt"', await request.aread())
                return httpx.Response(200, json=VALID_RESPONSE)

            results = await evaluate_cases(
                [case],
                endpoint="https://classify.example/v1/classify",
                language="de",
                concurrency=1,
                timeout_seconds=10,
                access_token="test-token",
                transport=httpx.MockTransport(handler),
            )
            summary = build_report_summary(results)

            self.assertEqual(results[0]["status"], "success")
            self.assertEqual(summary["isg"]["accuracy"], 1.0)
            self.assertEqual(summary["isg"]["macro_f1"], 1.0)


class MetricsTests(unittest.TestCase):
    def test_reports_under_and_over_classification(self) -> None:
        results = [
            {
                "status": "success",
                "expected_isg": "confidential",
                "expected_dsg": None,
                "prediction": {
                    "isg_isv": {"classification": "internal"},
                    "dsg": {"classification": "no_personal_data", "findings": []},
                },
                "latency_seconds": 1.0,
            },
            {
                "status": "success",
                "expected_isg": "internal",
                "expected_dsg": None,
                "prediction": {
                    "isg_isv": {"classification": "confidential"},
                    "dsg": {"classification": "personal_data", "findings": []},
                },
                "latency_seconds": 2.0,
            },
        ]

        summary = build_report_summary(results)

        self.assertEqual(summary["isg"]["under_classifications"], 1)
        self.assertEqual(summary["isg"]["over_classifications"], 1)
        self.assertEqual(summary["isg"]["accuracy"], 0.0)


if __name__ == "__main__":
    unittest.main()
