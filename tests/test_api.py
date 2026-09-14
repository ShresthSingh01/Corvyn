from pathlib import Path
from fastapi.testclient import TestClient
from backend.main import app

def test_api_endpoints():
    client = TestClient(app)

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "HEALTHY"
    print("[PASS] API: Health check OK.")

    # 2. Create case
    res = client.post("/api/cases?title=Test%20Phishing%20Syndicate")
    assert res.status_code == 200, res.text
    case_data = res.json()
    case_id = case_data["case_id"]
    print(f"[PASS] API: Created case {case_id}")

    # 3. Ingest files
    base_dir = Path(__file__).resolve().parent.parent
    bank_csv = base_dir / "data" / "synthetic" / "Bank_Settlement_Sheet.csv"
    cdr_csv = base_dir / "data" / "synthetic" / "CDR_Telecom_Records.csv"

    with open(bank_csv, "rb") as f_bank, open(cdr_csv, "rb") as f_cdr:
        res = client.post(
            f"/api/cases/{case_id}/ingest",
            files=[
                ("files", ("Bank_Settlement_Sheet.csv", f_bank, "text/csv")),
                ("files", ("CDR_Telecom_Records.csv", f_cdr, "text/csv")),
            ]
        )
    assert res.status_code == 200, res.text
    ingest_res = res.json()
    assert ingest_res["status"] == "INGESTION_COMPLETE"
    assert ingest_res["total_new_records"] > 0
    print(f"[PASS] API: Ingested evidence, total records: {ingest_res['total_new_records']}")

    # 4. Analyze
    res = client.post(f"/api/cases/{case_id}/analyze")
    assert res.status_code == 200, res.text
    analysis = res.json()
    assert analysis["case_id"] == case_id
    assert analysis["total_loss"] == 80000.0
    assert len(analysis["temporal_paths"]) > 0
    assert len(analysis["recommendations"]) > 0
    print(f"[PASS] API: Analysis completed in {analysis['time_to_insight_ms']}ms. Found {len(analysis['temporal_paths'])} temporal paths.")

    # 5. Graph
    res = client.get(f"/api/cases/{case_id}/graph")
    assert res.status_code == 200, res.text
    graph_res = res.json()
    assert len(graph_res["nodes"]) > 0
    assert len(graph_res["edges"]) > 0
    print(f"[PASS] API: Graph endpoint returned {len(graph_res['nodes'])} nodes and {len(graph_res['edges'])} edges.")

    # 6. Report PDF
    res = client.get(f"/api/cases/{case_id}/report")
    assert res.status_code == 200, res.text
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 1000
    print(f"[PASS] API: PDF brief download verified ({len(res.content)} bytes).")

    # 7. Report JSON
    res = client.get(f"/api/cases/{case_id}/report?format=json")
    assert res.status_code == 200, res.text
    assert res.json()["case_id"] == case_id
    print("[PASS] API: JSON report verified.")

    # 8. Reset Case Evidence
    res = client.post(f"/api/cases/{case_id}/reset")
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "RESET_COMPLETE"
    res = client.get(f"/api/cases/{case_id}")
    assert len(res.json()["files"]) == 0
    print("[PASS] API: Case reset verified (0 files remaining).")

    print("\nALL API ENDPOINTS FUNCTIONING WITH 100% SUCCESS!")

if __name__ == "__main__":
    test_api_endpoints()
