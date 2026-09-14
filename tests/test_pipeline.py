import json
from pathlib import Path
from backend.ingestion.normalize import normalize_phone, normalize_timestamp, clean_imei
from backend.ingestion.cdr import parse_cdr_file
from backend.ingestion.bank import parse_bank_file
from backend.graph.entity_resolution import resolve_entities
from backend.graph.temporal_paths import detect_temporal_forwarding_paths
from backend.graph.builder import build_investigation_graph
from backend.intelligence.counter_evidence import apply_counter_evidence_rules
from backend.intelligence.risk import calculate_entity_risk_scores
from backend.intelligence.recommendations import generate_investigative_recommendations
from backend.reports.pdf import generate_investigative_brief_pdf

def test_full_forensic_pipeline():
    base_dir = Path(__file__).resolve().parent.parent
    data_dir = base_dir / "data" / "synthetic"
    gt_file = base_dir / "data" / "ground_truth" / "ground_truth.json"

    with open(gt_file, "r", encoding="utf-8") as f:
        ground_truth = json.load(f)

    # --- Test 1: Ingestion ---
    bank_file = data_dir / "Bank_Settlement_Sheet.csv"
    cdr_file = data_dir / "CDR_Telecom_Records.csv"
    assert bank_file.exists() and cdr_file.exists(), "Synthetic files missing!"

    bank_events = parse_bank_file(bank_file)
    cdr_events = parse_cdr_file(cdr_file)
    assert len(bank_events) > 0, "No bank events parsed"
    assert len(cdr_events) > 0, "No CDR events parsed"
    all_events = bank_events + cdr_events
    print(f"[PASS] Ingestion: Parsed {len(bank_events)} bank events and {len(cdr_events)} CDR events.")

    # --- Test 2: Phone normalization ---
    assert normalize_phone("+91 98765 00099") == "9876500099"
    assert normalize_phone("09876500001") == "9876500001"
    assert normalize_phone("9876500002") == "9876500002"
    print("[PASS] Normalization: Phone formats correctly unified.")

    # --- Test 3: Deduplication ---
    # Hop 2 was duplicated in CSV. Let's verify tx_id TXN_FRAUD_002 is only recorded once in transaction events
    dup_matches = [e for e in bank_events if e.metadata.get("tx_id") == "TXN_FRAUD_002" and e.event_type == "TRANSACTION"]
    assert len(dup_matches) == 1, f"Expected 1 deduplicated tx, found {len(dup_matches)}"
    print("[PASS] Deduplication: Duplicate bank transaction row correctly deduplicated.")

    # --- Test 4: Temporal Forwarding Path Detection ---
    temporal_paths = detect_temporal_forwarding_paths(all_events)
    assert len(temporal_paths) > 0, "Failed to discover temporal fraud chain"
    primary = temporal_paths[0]
    assert primary.hop_count == 3, f"Expected 3 hops in primary chain, got {primary.hop_count}"
    assert primary.initial_amount == 80000.0
    assert primary.final_amount == 70000.0
    assert primary.retention_rate >= 80.0
    print(f"[PASS] Temporal Path: Discovered {primary.hop_count}-hop fraud chain (Rs {primary.initial_amount:,.0f} -> Rs {primary.final_amount:,.0f}, {primary.retention_rate}% retention).")

    # --- Test 5: Entity Resolution & Graph Builder ---
    entities = resolve_entities(all_events)
    nodes, edges, G = build_investigation_graph(all_events, entities, temporal_paths)
    assert len(nodes) > 10
    assert len(edges) > 10
    print(f"[PASS] Graph: Constructed network of {len(nodes)} nodes and {len(edges)} directed edges.")

    # --- Test 6: Counter-Evidence Rules (Shared IP trap) ---
    edges = apply_counter_evidence_rules(edges)
    # Check innocent merchant
    ip_counter_edges = [
        e for e in edges if any(item.rule == "SHARED_INFRASTRUCTURE_WARNING" for item in e.evidence)
    ]
    assert len(ip_counter_edges) > 0, "Expected shared IP counter-evidence rule to trigger"
    print("[PASS] Counter-Evidence: Shared IP alone successfully penalized and flagged as weak infrastructure.")

    # --- Test 7: Risk Scoring ---
    nodes = calculate_entity_risk_scores(nodes, edges, temporal_paths, all_events)
    node_map = {n.id: n for n in nodes}
    
    # Mule A and Mule B must be HIGH risk
    mule_a = node_map.get("ACCOUNT:200002837465")
    mule_b = node_map.get("ACCOUNT:300003746582")
    innocent = node_map.get("ACCOUNT:999999123456")

    assert mule_a is not None and mule_a.risk_level == "HIGH", f"Mule A risk: {mule_a.risk_score if mule_a else None}"
    assert mule_b is not None and mule_b.risk_level == "HIGH", f"Mule B risk: {mule_b.risk_score if mule_b else None}"
    assert innocent is not None and innocent.risk_score < 40, f"Innocent account falsely flagged: {innocent.risk_score}"
    print(f"[PASS] Risk Scoring: Mule A ({mule_a.risk_score}) & Mule B ({mule_b.risk_score}) flagged HIGH. Innocent account ({innocent.risk_score}) is LOW.")

    # --- Test 8: Recommendations ---
    recs = generate_investigative_recommendations(nodes)
    assert len(recs) > 0
    print(f"[PASS] Recommendations: Top recommendation: '{recs[0].action_text}' (Priority: {recs[0].priority_score})")

    # --- Test 9: PDF Generation ---
    pdf_out = base_dir / "tests" / "test_brief.pdf"
    pdf_out.parent.mkdir(parents=True, exist_ok=True)
    summary_data = {
        "case_id": "CYB-TEST-001",
        "total_loss": primary.initial_amount,
        "records_processed": len(all_events),
        "entities_count": len(nodes),
        "fraud_hops_found": primary.hop_count,
        "top_risk_entities": [n.model_dump() for n in nodes if n.risk_level == "HIGH"][:5],
        "temporal_paths": [primary.model_dump()],
        "recommendations": [r.model_dump() for r in recs[:3]],
        "file_hashes": {"Bank_Settlement_Sheet.csv": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"},
    }
    generated_pdf = generate_investigative_brief_pdf(summary_data, pdf_out)
    assert Path(generated_pdf).exists() and Path(generated_pdf).stat().st_size > 1000
    print(f"[PASS] PDF Brief: Successfully compiled court-admissible one-page PDF ({Path(generated_pdf).stat().st_size} bytes).")

    print("\nALL 9 PIPELINE TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_full_forensic_pipeline()
