from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
CASES_DIR = DATA_DIR / "cases"

CASES_DIR.mkdir(parents=True, exist_ok=True)

# Evidence Heuristic Weights (from MVP specification)
EVIDENCE_WEIGHTS = {
    "EXACT_TRANSACTION": 40,
    "SAME_IMEI": 25,
    "SAME_IMSI": 20,
    "TEMPORAL_OVERLAP": 15,
    "REPEATED_COMMUNICATION": 10,
    "SAME_IP": 5,
    "SHARED_INFRASTRUCTURE_PENALTY": -10,
}

# Temporal analysis constraints
RAPID_FORWARD_WINDOW_SECONDS = 900  # 15 minutes window
MAX_FORWARD_HOPS = 6

# Risk levels
RISK_THRESHOLDS = {
    "LOW": (0, 39),
    "MEDIUM": (40, 64),
    "HIGH": (65, 100),
}
