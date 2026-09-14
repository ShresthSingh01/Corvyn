from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.cases import router as cases_router
from backend.api.ingestion import router as ingestion_router
from backend.api.analysis import router as analysis_router
from backend.api.reports import router as reports_router
from backend.api.samples import router as samples_router

app = FastAPI(
    title="Corvyn Forensic API",
    description="Unified Cyber Fraud Analysis & Digital Artifact Correlator Engine",
    version="1.0.0",
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount core routers
app.include_router(cases_router)
app.include_router(ingestion_router)
app.include_router(analysis_router)
app.include_router(reports_router)
app.include_router(samples_router)


@app.get("/api/health")
def health_check():
    return {"status": "HEALTHY", "engine": "Corvyn Offline Forensic Pipeline"}

import os
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import Request, HTTPException

# Mount frontend build if it exists (for Render / Docker unified deployment)
DIST_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if DIST_DIR.exists():
    assets_dir = DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        target = DIST_DIR / full_path
        if full_path and target.is_file():
            return FileResponse(target)
        index_file = DIST_DIR / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend build index.html not found")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)

