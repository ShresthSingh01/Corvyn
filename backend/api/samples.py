import io
import zipfile
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from backend.core.config import DATA_DIR

router = APIRouter(prefix="/api/samples", tags=["samples"])

@router.get("/zip")
def download_sample_package():
    """Returns a single ZIP archive of all sample forensic evidence files for judge demo testing."""
    synthetic_dir = DATA_DIR / "synthetic"
    if not synthetic_dir.exists():
        raise HTTPException(status_code=444, detail="Synthetic samples directory not found")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for file_path in synthetic_dir.iterdir():
            if file_path.is_file() and not file_path.name.startswith("_temp"):
                zip_file.write(file_path, arcname=file_path.name)

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=Corvyn_Sample_Evidence_Package.zip"},
    )
