import json
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from backend.core.config import CASES_DIR
from backend.reports.pdf import generate_investigative_brief_pdf

router = APIRouter(prefix="/api/cases", tags=["reports"])

@router.get("/{case_id}/report")
def get_case_report(case_id: str, format: str = Query("pdf", pattern="^(pdf|json)$")):

    """
    Generate or download court-traceable investigative brief.
    Supports standardized one-page PDF or structured JSON.
    """
    case_dir = CASES_DIR / case_id
    if not case_dir.exists():
        raise HTTPException(status_code=404, detail="Case not found")

    analysis_path = case_dir / "analysis.json"
    if not analysis_path.exists():
        raise HTTPException(status_code=400, detail="Run analysis before generating report.")

    with open(analysis_path, "r", encoding="utf-8") as f:
        summary_data = json.load(f)

    if format == "json":
        return summary_data

    # Generate PDF
    pdf_path = case_dir / "Investigative_Brief.pdf"
    generate_investigative_brief_pdf(summary_data, pdf_path)

    return FileResponse(
        path=str(pdf_path),
        filename=f"Corvyn_{case_id}_Forensic_Brief.pdf",
        media_type="application/pdf",
    )
