import json
import time
from pathlib import Path
from fastapi import APIRouter, HTTPException
from backend.core.config import CASES_DIR
from backend.models.schemas import CanonicalEvent, AnalysisSummary, CaseMetadata
from backend.graph.entity_resolution import resolve_entities
from backend.graph.temporal_paths import detect_temporal_forwarding_paths
from backend.graph.builder import build_investigation_graph
from backend.intelligence.counter_evidence import apply_counter_evidence_rules
from backend.intelligence.risk import calculate_entity_risk_scores
from backend.intelligence.recommendations import generate_investigative_recommendations

router = APIRouter(prefix="/api/cases", tags=["analysis"])

@router.post("/{case_id}/analyze", response_model=AnalysisSummary)
def run_forensic_pipeline(case_id: str) -> AnalysisSummary:
    """
    Executes the full forensic correlation engine:
    1. Entity Resolution
    2. Temporal Forwarding Path Discovery
    3. Multi-artifact Graph Construction & Edge Evidence Synthesizing
    4. Counter-Evidence False Link Suppression
    5. Auditable Heuristic Risk Scoring
    6. Actionable Next-Best-Action Directives
    """
    start_time = time.perf_counter()
    case_dir = CASES_DIR / case_id
    if not case_dir.exists():
        raise HTTPException(status_code=404, detail="Case container not found")

    events_path = case_dir / "events.json"
    if not events_path.exists():
        raise HTTPException(status_code=400, detail="No evidence events ingested yet. Upload files first.")

    # Load canonical events
    with open(events_path, "r", encoding="utf-8") as f:
        raw_events = json.load(f)
    events = [CanonicalEvent(**ev) for ev in raw_events]

    # Load metadata for file hashes
    meta_path = case_dir / "metadata.json"
    file_hashes = {}
    if meta_path.exists():
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = CaseMetadata(**json.load(f))
            file_hashes = meta.file_hashes

    # 1. Entity Resolution
    entity_nodes = resolve_entities(events)

    # 2. Temporal Forwarding Path Detection
    temporal_paths = detect_temporal_forwarding_paths(events)

    # 3. Build Graph
    nodes, edges, nx_graph = build_investigation_graph(events, entity_nodes, temporal_paths)

    # 4. Apply Counter-Evidence Rules
    edges = apply_counter_evidence_rules(edges)

    # 5. Risk Scoring
    nodes = calculate_entity_risk_scores(nodes, edges, temporal_paths, events)

    # 6. Recommendations
    recommendations = generate_investigative_recommendations(nodes)

    # Compute overall summary metrics
    total_loss = sum(tp.initial_amount for tp in temporal_paths) if temporal_paths else sum(e.amount or 0 for e in edges if e.type == "TRANSACTION")
    top_entities = sorted(nodes, key=lambda n: n.risk_score, reverse=True)[:10]
    duration_ms = int((time.perf_counter() - start_time) * 1000)

    summary = AnalysisSummary(
        case_id=case_id,
        total_loss=round(total_loss, 2),
        records_processed=len(events),
        entities_count=len(nodes),
        fraud_hops_found=sum(tp.hop_count for tp in temporal_paths),
        top_risk_entities=top_entities,
        temporal_paths=temporal_paths,
        recommendations=recommendations,
        nodes=nodes,
        edges=edges,
        file_hashes=file_hashes,
        time_to_insight_ms=duration_ms,
    )

    # Persist analysis results
    analysis_file = case_dir / "analysis.json"
    with open(analysis_file, "w", encoding="utf-8") as f:
        json.dump(summary.model_dump(), f, indent=2)

    return summary

@router.get("/{case_id}/graph", response_model=AnalysisSummary)
def get_investigation_graph(case_id: str) -> AnalysisSummary:
    """Retrieve existing analysis results or compute them if not yet generated."""
    case_dir = CASES_DIR / case_id
    if not case_dir.exists():
        raise HTTPException(status_code=404, detail="Case not found")

    analysis_file = case_dir / "analysis.json"
    if analysis_file.exists():
        with open(analysis_file, "r", encoding="utf-8") as f:
            return AnalysisSummary(**json.load(f))

    # Auto-run analysis if events exist
    events_path = case_dir / "events.json"
    if events_path.exists():
        return run_forensic_pipeline(case_id)

    raise HTTPException(status_code=400, detail="Case has no ingested evidence yet.")
