from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class EntityType(str, Enum):
    PHONE = "PHONE"
    IMEI = "IMEI"
    IMSI = "IMSI"
    ACCOUNT = "ACCOUNT"
    UPI = "UPI"
    IP = "IP"
    EMAIL = "EMAIL"
    MAC = "MAC"
    UNKNOWN = "UNKNOWN"


class EventType(str, Enum):
    CALL = "CALL"
    TRANSACTION = "TRANSACTION"
    DEVICE_USE = "DEVICE_USE"
    IP_SESSION = "IP_SESSION"

class CanonicalEvent(BaseModel):
    timestamp: str
    source_type: str  # "CDR", "BANK", "ANDROID"
    entity_a: str
    entity_b: str
    event_type: str
    amount: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    evidence_file: str
    evidence_row: int
    evidence_hash: str

class EvidenceItem(BaseModel):
    rule: str
    weight: float
    description: str
    source_file: str
    source_row: int
    is_counter_evidence: bool = False

class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # PHONE, IMEI, ACCOUNT, UPI, IP
    risk_score: float = 0.0
    risk_level: str = "LOW"  # LOW, MEDIUM, HIGH
    component_scores: Dict[str, float] = Field(default_factory=dict)
    is_mule_candidate: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str
    confidence: float
    amount: Optional[float] = None
    timestamp: Optional[str] = None
    time_delta_seconds: Optional[float] = None
    is_fraud_path: bool = False
    evidence: List[EvidenceItem] = Field(default_factory=list)

class TemporalHop(BaseModel):
    from_entity: str
    to_entity: str
    amount: float
    timestamp: str
    time_delta_seconds: float
    tx_id: Optional[str] = None

class TemporalPath(BaseModel):
    path_id: str
    hops: List[TemporalHop]
    total_duration_seconds: float
    initial_amount: float
    final_amount: float
    retention_rate: float
    hop_count: int

class NextBestAction(BaseModel):
    priority_rank: int
    target_entity: str
    action_text: str
    reason: str
    priority_score: float

class CaseMetadata(BaseModel):
    case_id: str
    title: str
    description: str = ""
    created_at: str
    files: List[str] = Field(default_factory=list)
    file_hashes: Dict[str, str] = Field(default_factory=dict)

class AnalysisSummary(BaseModel):
    case_id: str
    total_loss: float
    records_processed: int
    entities_count: int
    fraud_hops_found: int
    top_risk_entities: List[GraphNode]
    temporal_paths: List[TemporalPath]
    recommendations: List[NextBestAction]
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    file_hashes: Dict[str, str]
    time_to_insight_ms: int
