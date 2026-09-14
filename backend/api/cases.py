import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from backend.models.schemas import CaseMetadata, CanonicalEvent
from backend.core.config import CASES_DIR, DATA_DIR
from backend.core.hashing import hash_file
from backend.ingestion.bank import parse_bank_file
from backend.ingestion.cdr import parse_cdr_file
from backend.api.analysis import run_forensic_pipeline

router = APIRouter(prefix="/api/cases", tags=["cases"])

@router.post("", response_model=CaseMetadata)
def create_case(title: str = "Cyber Fraud Case", description: str = ""):
    """Initialize a new investigation case container."""
    case_id = f"CYB-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    case_dir = CASES_DIR / case_id
    evidence_dir = case_dir / "evidence"
    evidence_dir.mkdir(parents=True, exist_ok=True)

    meta = CaseMetadata(
        case_id=case_id,
        title=title,
        description=description,
        created_at=datetime.now().isoformat(),
        files=[],
        file_hashes={},
    )

    with open(case_dir / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(meta.model_dump(), f, indent=2)

    return meta

@router.get("/demo-status")
def get_demo_status() -> Dict[str, Any]:
    """Check if a pre-seeded demo case exists."""
    if not CASES_DIR.exists():
        return {"seeded": False, "case_id": None}
    
    for p in sorted(CASES_DIR.iterdir(), reverse=True):
        meta_file = p / "metadata.json"
        events_file = p / "events.json"
        if meta_file.exists() and events_file.exists():
            try:
                with open(meta_file, "r", encoding="utf-8") as f:
                    meta_data = json.load(f)
                    return {"seeded": True, "case_id": meta_data["case_id"]}
            except Exception:
                continue
    return {"seeded": False, "case_id": None}

@router.post("/seed")
def seed_demo_case():
    """Seeds a rich demo case from synthetic datasets if no active case exists."""
    demo_case_id = "CYB-DEMO-001"
    case_dir = CASES_DIR / demo_case_id
    evidence_dir = case_dir / "evidence"
    evidence_dir.mkdir(parents=True, exist_ok=True)

    meta_file = case_dir / "metadata.json"
    events_file = case_dir / "events.json"

    synthetic_dir = DATA_DIR / "synthetic"
    files_to_seed = ["Bank_Settlement_Sheet.csv", "CDR_Telecom_Records.csv"]

    meta = CaseMetadata(
        case_id=demo_case_id,
        title="Operation Phantom Mule (National Cyber Crime Unit)",
        description="Mule account network correlation & temporal forwarding investigation",
        created_at=datetime.now().isoformat(),
        files=[],
        file_hashes={},
    )

    all_events: List[CanonicalEvent] = []

    for fname in files_to_seed:
        src = synthetic_dir / fname
        if not src.exists():
            continue
        dest = evidence_dir / fname
        shutil.copy2(src, dest)

        f_hash = hash_file(dest)
        meta.file_hashes[fname] = f_hash
        meta.files.append(fname)

        if "bank" in fname.lower() or "settlement" in fname.lower():
            parsed = parse_bank_file(dest)
        else:
            parsed = parse_cdr_file(dest)
        all_events.extend(parsed)

    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(meta.model_dump(), f, indent=2)

    with open(events_file, "w", encoding="utf-8") as f:
        json.dump([e.model_dump() for e in all_events], f, indent=2)

    summary = run_forensic_pipeline(demo_case_id)
    return {"metadata": meta.model_dump(), "summary": summary.model_dump()}

@router.get("", response_model=List[CaseMetadata])
def list_cases():
    """List all local cases."""
    cases = []
    if not CASES_DIR.exists():
        return cases

    for p in sorted(CASES_DIR.iterdir(), reverse=True):
        meta_file = p / "metadata.json"
        if meta_file.exists():
            try:
                with open(meta_file, "r", encoding="utf-8") as f:
                    cases.append(CaseMetadata(**json.load(f)))
            except Exception:
                continue
    return cases

@router.get("/{case_id}", response_model=CaseMetadata)
def get_case(case_id: str):
    """Get metadata for specific case."""
    meta_file = CASES_DIR / case_id / "metadata.json"
    if not meta_file.exists():
        raise HTTPException(status_code=404, detail="Case not found")
    with open(meta_file, "r", encoding="utf-8") as f:
        return CaseMetadata(**json.load(f))

