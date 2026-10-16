from __future__ import annotations

import hashlib
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

ISG_LABELS = {
    "NOT_CLASSIFIED": "unclassified",
    "not_classified": "unclassified",
    "UNCLASSIFIED": "unclassified",
    "unclassified": "unclassified",
    "INTERN": "internal",
    "intern": "internal",
    "INTERNAL": "internal",
    "internal": "internal",
    "VERTRAULICH": "confidential",
    "vertraulich": "confidential",
    "CONFIDENTIAL": "confidential",
    "confidential": "confidential",
    "GEHEIM": "secret",
    "geheim": "secret",
    "SECRET": "secret",
    "secret": "secret",
}


class DatasetError(ValueError):
    pass


@dataclass(frozen=True)
class EvaluationCase:
    case_id: str
    document_path: Path
    annotation_path: Path
    expected_isg: str | None
    expected_dsg: str | None
    annotation_status: str | None
    sha256: str

    def as_dict(self) -> dict[str, Any]:
        return {
            "case_id": self.case_id,
            "document": str(self.document_path),
            "annotation": str(self.annotation_path),
            "expected_isg": self.expected_isg,
            "expected_dsg": self.expected_dsg,
            "annotation_status": self.annotation_status,
            "sha256": self.sha256,
        }


@dataclass(frozen=True)
class LoadedDataset:
    root: Path
    cases: list[EvaluationCase]
    warnings: list[str]
    manifest_declared_total: int | None
    manifest_case_count: int

    def summary(self) -> dict[str, Any]:
        isg_counts = Counter(case.expected_isg for case in self.cases if case.expected_isg)
        dsg_counts = Counter(case.expected_dsg for case in self.cases if case.expected_dsg)
        return {
            "root": str(self.root),
            "discovered_cases": len(self.cases),
            "manifest_declared_total": self.manifest_declared_total,
            "manifest_case_count": self.manifest_case_count,
            "scoreable_isg_cases": sum(isg_counts.values()),
            "scoreable_dsg_cases": sum(dsg_counts.values()),
            "expected_isg_distribution": dict(sorted(isg_counts.items())),
            "expected_dsg_distribution": dict(sorted(dsg_counts.items())),
            "warnings": self.warnings,
        }


def load_dataset(root: Path) -> LoadedDataset:
    root = root.resolve()
    annotation_root = root / "ground_truth"
    document_root = root / "documents"
    if not annotation_root.is_dir() or not document_root.is_dir():
        raise DatasetError(
            f"Dataset root must contain ground_truth/ and documents/ directories: {root}"
        )

    manifest, manifest_entries = _load_manifest(root / "manifest.yaml")
    warnings = _manifest_warnings(manifest, manifest_entries)
    cases: list[EvaluationCase] = []

    for annotation_path in sorted(annotation_root.glob("GT-*.yaml")):
        annotation = _load_yaml_mapping(annotation_path)
        case_id = _case_id(annotation, annotation_path)
        document_path = _document_path(document_root, annotation, case_id)
        if not document_path.is_file():
            raise DatasetError(f"{case_id}: document does not exist: {document_path}")

        digest = hashlib.sha256(document_path.read_bytes()).hexdigest()
        manifest_entry = manifest_entries.get(case_id)
        if manifest_entry:
            expected_digest = manifest_entry.get("sha256")
            if expected_digest and expected_digest != digest:
                warnings.append(f"{case_id}: document SHA-256 does not match manifest")

        expected_isg, status = _expected_isg(annotation)
        cases.append(
            EvaluationCase(
                case_id=case_id,
                document_path=document_path,
                annotation_path=annotation_path,
                expected_isg=expected_isg,
                expected_dsg=_expected_dsg(annotation),
                annotation_status=status,
                sha256=digest,
            )
        )

    if not cases:
        raise DatasetError(f"No GT-*.yaml annotations found in {annotation_root}")

    discovered_ids = {case.case_id for case in cases}
    missing_from_manifest = sorted(discovered_ids - manifest_entries.keys())
    missing_from_disk = sorted(manifest_entries.keys() - discovered_ids)
    if missing_from_manifest:
        warnings.append(
            f"{len(missing_from_manifest)} discovered cases are absent from manifest: "
            f"{missing_from_manifest[0]}..{missing_from_manifest[-1]}"
        )
    if missing_from_disk:
        warnings.append(
            f"{len(missing_from_disk)} manifest cases have no discovered annotation: "
            + ", ".join(missing_from_disk[:5])
        )

    return LoadedDataset(
        root=root,
        cases=cases,
        warnings=warnings,
        manifest_declared_total=manifest.get("total_documents"),
        manifest_case_count=len(manifest_entries),
    )


def _load_manifest(path: Path) -> tuple[dict[str, Any], dict[str, dict[str, Any]]]:
    if not path.is_file():
        return {}, {}
    manifest = _load_yaml_mapping(path)
    documents = manifest.get("documents", [])
    if not isinstance(documents, list):
        raise DatasetError(f"Manifest documents must be a list: {path}")
    entries: dict[str, dict[str, Any]] = {}
    for item in documents:
        if isinstance(item, dict) and isinstance(item.get("id"), str):
            entries[item["id"]] = item
    return manifest, entries


def _manifest_warnings(
    manifest: dict[str, Any], entries: dict[str, dict[str, Any]]
) -> list[str]:
    warnings: list[str] = []
    declared_total = manifest.get("total_documents")
    if isinstance(declared_total, int) and declared_total != len(entries):
        warnings.append(
            f"Manifest declares {declared_total} documents but contains {len(entries)} entries"
        )
    return warnings


def _load_yaml_mapping(path: Path) -> dict[str, Any]:
    try:
        value = yaml.safe_load(path.read_text(encoding="utf-8"))
    except (OSError, yaml.YAMLError) as error:
        raise DatasetError(f"Could not read YAML file {path}: {error}") from error
    if not isinstance(value, dict):
        raise DatasetError(f"Expected a YAML mapping in {path}")
    return value


def _case_id(annotation: dict[str, Any], annotation_path: Path) -> str:
    candidates = [
        annotation.get("test_id"),
        annotation.get("case_id"),
        _nested(annotation, "test", "id"),
        annotation_path.stem,
    ]
    for candidate in candidates:
        if isinstance(candidate, str) and candidate.startswith("GT-"):
            return candidate
    raise DatasetError(f"Could not determine case id from {annotation_path}")


def _document_path(document_root: Path, annotation: dict[str, Any], case_id: str) -> Path:
    filename = _nested(annotation, "document", "filename")
    if isinstance(filename, str):
        candidate = document_root / Path(filename).name
        if candidate.is_file():
            return candidate

    matches = sorted(document_root.glob(f"{case_id}_*"))
    if len(matches) != 1:
        raise DatasetError(
            f"{case_id}: expected exactly one matching document, found {len(matches)}"
        )
    return matches[0]


def _expected_isg(annotation: dict[str, Any]) -> tuple[str | None, str | None]:
    information_security = annotation.get("information_security")
    if isinstance(information_security, dict):
        raw = information_security.get("expected_classification")
        status = information_security.get("assessment_status")
        if isinstance(raw, str):
            normalized = ISG_LABELS.get(raw)
            if normalized:
                return normalized, status if isinstance(status, str) else None

    # Earlier annotations contain explicitly non-scoreable proposals. Preserve their
    # status for reporting, but do not turn them into evaluator targets.
    proposal = annotation.get("isv_expected_classification_proposal")
    if isinstance(proposal, dict):
        status = proposal.get("status")
        return None, status if isinstance(status, str) else None
    return None, None


def _expected_dsg(annotation: dict[str, Any]) -> str | None:
    candidates = [
        _nested(annotation, "privacy_assessment", "expected_classification"),
        _nested(annotation, "legal_assessment", "privacy", "expected_classification"),
    ]
    mapping = {
        "NO_PERSONAL_DATA": "no_personal_data",
        "no_personal_data": "no_personal_data",
        "PERSONAL_DATA": "personal_data",
        "personal_data": "personal_data",
        "SENSITIVE_PERSONAL_DATA": "sensitive_personal_data",
        "sensitive_personal_data": "sensitive_personal_data",
    }
    for candidate in candidates:
        if isinstance(candidate, str):
            return mapping.get(candidate, candidate if candidate in mapping.values() else None)
    return None


def _nested(value: dict[str, Any], *keys: str) -> Any:
    current: Any = value
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current
