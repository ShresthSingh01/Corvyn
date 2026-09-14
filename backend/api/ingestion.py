import json
import shutil
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.core.config import CASES_DIR
from backend.core.hashing import hash_file
from backend.models.schemas import CanonicalEvent, CaseMetadata
from backend.ingestion.cdr import parse_cdr_file
from backend.ingestion.bank import parse_bank_file
from backend.ingestion.excel import parse_excel_file
from backend.ingestion.eml import parse_eml_file
from backend.ingestion.android import parse_android_dump
from backend.ingestion.ipdr import parse_ipdr_file

router = APIRouter(prefix="/api/cases", tags=["ingestion"])

@router.post("/{case_id}/ingest")
async def ingest_evidence(case_id: str, files: List[UploadFile] = File(...)) -> Dict[str, Any]:
    """
    Ingests multiple evidence files (CSV, XLSX, EML, Android dumps, IPDR).
    Saves raw files, computes forensic SHA-256 digests, normalizes into canonical events.
    """
    case_dir = CASES_DIR / case_id
    if not case_dir.exists():
        raise HTTPException(status_code=404, detail="Case container does not exist")

    evidence_dir = case_dir / "evidence"
    evidence_dir.mkdir(parents=True, exist_ok=True)

    # Load existing metadata
    meta_path = case_dir / "metadata.json"
    with open(meta_path, "r", encoding="utf-8") as f:
        meta = CaseMetadata(**json.load(f))

    # Load existing events if any
    events_path = case_dir / "events.json"
    existing_events: List[Dict[str, Any]] = []
    if events_path.exists():
        with open(events_path, "r", encoding="utf-8") as f:
            existing_events = json.load(f)

    new_events: List[CanonicalEvent] = []
    processed_files: List[Dict[str, Any]] = []
    parse_warnings: List[str] = []

    for upload in files:
        safe_filename = upload.filename.replace(" ", "_")
        dest_path = evidence_dir / safe_filename

        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(upload.file, buffer)

        # Compute evidentiary hash
        f_hash = hash_file(dest_path)
        meta.file_hashes[safe_filename] = f_hash
        if safe_filename not in meta.files:
            meta.files.append(safe_filename)

        # Multi-format routing
        parsed_batch: List[CanonicalEvent] = []
        fname_lower = safe_filename.lower()

        try:
            if fname_lower.endswith(".xlsx") or fname_lower.endswith(".xls"):
                parsed_batch = parse_excel_file(dest_path)
            elif fname_lower.endswith(".eml"):
                parsed_batch = parse_eml_file(dest_path)
            elif fname_lower.endswith(".json") or "android" in fname_lower or "dump" in fname_lower:
                parsed_batch = parse_android_dump(dest_path)
            elif "ipdr" in fname_lower:
                parsed_batch = parse_ipdr_file(dest_path)
            elif "bank" in fname_lower or "upi" in fname_lower or "tx" in fname_lower or "statement" in fname_lower or "settlement" in fname_lower:
                parsed_batch = parse_bank_file(dest_path)
            elif "cdr" in fname_lower or "call" in fname_lower or "telecom" in fname_lower:
                parsed_batch = parse_cdr_file(dest_path)
            else:
                # Fallback: inspect header line of text file
                try:
                    with open(dest_path, "r", encoding="utf-8-sig", errors="replace") as peek_f:
                        first_line = peek_f.readline().lower()
                        if "caller" in first_line or "callee" in first_line or "imei" in first_line:
                            parsed_batch = parse_cdr_file(dest_path)
                        elif "msisdn" in first_line and "ip" in first_line:
                            parsed_batch = parse_ipdr_file(dest_path)
                        else:
                            parsed_batch = parse_bank_file(dest_path)
                except Exception:
                    parsed_batch = parse_bank_file(dest_path)
        except Exception as err:
            parse_warnings.append(f"Warning parsing {safe_filename}: {str(err)}")

        if len(parsed_batch) == 0:
            parse_warnings.append(f"No records extracted from {safe_filename}. Check header column names.")

        new_events.extend(parsed_batch)
        processed_files.append({
            "filename": safe_filename,
            "sha256": f_hash,
            "records_extracted": len(parsed_batch),
        })

    # Persist updated metadata
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta.model_dump(), f, indent=2)

    # Persist cumulative events
    all_events_dicts = existing_events + [e.model_dump() for e in new_events]
    with open(events_path, "w", encoding="utf-8") as f:
        json.dump(all_events_dicts, f, indent=2)

    return {
        "case_id": case_id,
        "files_processed": processed_files,
        "total_new_records": len(new_events),
        "cumulative_records": len(all_events_dicts),
        "parse_warnings": parse_warnings,
        "status": "INGESTION_COMPLETE",
    }

