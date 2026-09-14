import sys
import json
import shutil
from datetime import datetime
from pathlib import Path
from backend.core.config import CASES_DIR
from backend.models.schemas import CaseMetadata
from backend.api.ingestion import parse_bank_file, parse_cdr_file
from backend.api.analysis import run_forensic_pipeline
from backend.reports.pdf import generate_investigative_brief_pdf

def seed_demo_case():
    base_dir = Path(__file__).resolve().parent
    data_dir = base_dir / "data" / "synthetic"
    bank_src = data_dir / "Bank_Settlement_Sheet.csv"
    cdr_src = data_dir / "CDR_Telecom_Records.csv"

    if not bank_src.exists() or not cdr_src.exists():
        print("Generating synthetic data first...")
        import subprocess
        subprocess.run([sys.executable, "data/synthetic/generate_data.py"], cwd=base_dir)

    case_id = "CYB-2026-001"
    case_dir = CASES_DIR / case_id
    evidence_dir = case_dir / "evidence"
    evidence_dir.mkdir(parents=True, exist_ok=True)

    # Copy files
    shutil.copy2(bank_src, evidence_dir / "Bank_Settlement_Sheet.csv")
    shutil.copy2(cdr_src, evidence_dir / "CDR_Telecom_Records.csv")

    from backend.core.hashing import hash_file
    hash_bank = hash_file(evidence_dir / "Bank_Settlement_Sheet.csv")
    hash_cdr = hash_file(evidence_dir / "CDR_Telecom_Records.csv")

    meta = CaseMetadata(
        case_id=case_id,
        title="Phishing Syndicate & Multi-Hop Mule Operation",
        description="Victim complaint: Rs 80,000 fraud via malicious APK and rapid 3-hop mule account forwarding.",
        created_at=datetime.now().isoformat(),
        files=["Bank_Settlement_Sheet.csv", "CDR_Telecom_Records.csv"],
        file_hashes={
            "Bank_Settlement_Sheet.csv": hash_bank,
            "CDR_Telecom_Records.csv": hash_cdr,
        }
    )

    with open(case_dir / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(meta.model_dump(), f, indent=2)

    # Parse and store canonical events
    bank_events = parse_bank_file(evidence_dir / "Bank_Settlement_Sheet.csv")
    cdr_events = parse_cdr_file(evidence_dir / "CDR_Telecom_Records.csv")
    all_events = bank_events + cdr_events

    with open(case_dir / "events.json", "w", encoding="utf-8") as f:
        json.dump([e.model_dump() for e in all_events], f, indent=2)

    # Run analysis
    summary = run_forensic_pipeline(case_id)

    # Generate initial PDF brief
    pdf_path = case_dir / "Investigative_Brief.pdf"
    generate_investigative_brief_pdf(summary.model_dump(), pdf_path)

    print(f"Successfully seeded case {case_id} with {len(all_events)} events!")
    print(f"Analysis complete: Loss: Rs {summary.total_loss:,.2f}, Hops: {summary.fraud_hops_found}")

if __name__ == "__main__":
    seed_demo_case()
