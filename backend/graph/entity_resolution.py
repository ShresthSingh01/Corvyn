from typing import Dict, List
from backend.models.schemas import CanonicalEvent, GraphNode, EntityType

def resolve_entities(events: List[CanonicalEvent]) -> Dict[str, GraphNode]:
    """
    Deterministic entity resolution from canonical events.
    Extracts entities, assigns type and human-readable label.
    """
    registry: Dict[str, GraphNode] = {}

    def get_or_create(raw_id: str) -> GraphNode:
        if raw_id in registry:
            return registry[raw_id]

        # Determine type from prefix
        if ":" in raw_id:
            etype, val = raw_id.split(":", 1)
            etype = etype.upper()
        else:
            etype = "UNKNOWN"
            val = raw_id

        # Human friendly label
        label = val
        if etype == "PHONE":
            label = f"+91 {val}" if len(val) == 10 else val
        elif etype == "ACCOUNT":
            label = f"A/C ...{val[-4:]}" if len(val) >= 4 else f"A/C {val}"
        elif etype == "UPI":
            label = val
        elif etype == "IMEI":
            label = f"IMEI ...{val[-4:]}" if len(val) >= 4 else f"IMEI {val}"
        elif etype == "IP":
            label = f"IP {val}"

        node = GraphNode(
            id=raw_id,
            label=label,
            type=etype if etype in EntityType.__members__ else EntityType.UNKNOWN.value,
            risk_score=0.0,
            risk_level="LOW",
            metadata={"raw_value": val},
        )
        registry[raw_id] = node
        return node

    for ev in events:
        get_or_create(ev.entity_a)
        get_or_create(ev.entity_b)

    return registry
