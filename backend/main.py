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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
