from typing import List, Dict, Set
from backend.models.schemas import GraphNode, TemporalPath, CanonicalEvent, GraphEdge
from backend.core.config import RISK_THRESHOLDS

def calculate_entity_risk_scores(
    nodes: List[GraphNode],
    edges: List[GraphEdge],
    temporal_paths: List[TemporalPath],
    events: List[CanonicalEvent],
) -> List[GraphNode]:
    """
    Transparent forensic heuristic risk scoring (0-100).
    Decomposes score into auditable components:
    - Rapid forwarding (+25)
    - Multi-hop participation (+20)
    - High amount retention (+20)
    - Device reuse (+15)
    - Cross-artifact confirmation (+10)
    - Weak infrastructure penalty (-10)
    """
    node_map = {n.id: n for n in nodes}

    # 1. Identify intermediate mule entities and cashout points in temporal paths
    intermediate_mules: Set[str] = set()
    cashout_endpoints: Set[str] = set()
    high_retention_mules: Set[str] = set()

    for tp in temporal_paths:
        for i, hop in enumerate(tp.hops):
            if i > 0:  # Has incoming from earlier hop
                intermediate_mules.add(hop.from_entity)
            if i == len(tp.hops) - 1:
                cashout_endpoints.add(hop.to_entity)
        if tp.retention_rate >= 60.0:
            for hop in tp.hops[1:]:
                high_retention_mules.add(hop.from_entity)

    # 2. Identify device reuse (IMEIs linked to > 1 phone)
    imei_to_phones: Dict[str, Set[str]] = {}
    for ev in events:
        if ev.source_type == "CDR" and "IMEI:" in ev.entity_b:
            imei_to_phones.setdefault(ev.entity_b, set()).add(ev.entity_a)
    
    reused_devices: Set[str] = {imei for imei, phones in imei_to_phones.items() if len(phones) > 1}
    phones_with_reused_devices: Set[str] = {
        phone for imei in reused_devices for phone in imei_to_phones[imei]
    }

    # 3. Cross-artifact appearance (entities present across telecom and bank logs)
    sources_per_entity: Dict[str, Set[str]] = {}
    for ev in events:
        sources_per_entity.setdefault(ev.entity_a, set()).add(ev.source_type)
        sources_per_entity.setdefault(ev.entity_b, set()).add(ev.source_type)

    # 4. Check edge profiles (does entity ONLY have IP links?)
    entity_edge_types: Dict[str, Set[str]] = {}
    for e in edges:
        entity_edge_types.setdefault(e.source, set()).add(e.type)
        entity_edge_types.setdefault(e.target, set()).add(e.type)

    # Compute component scores for each node
    for node in nodes:
        components: Dict[str, float] = {}

        # Rapid Forwarding (+25)
        if node.id in intermediate_mules:
            components["rapid_forwarding"] = 25.0
            node.is_mule_candidate = True

        # Multi-Hop Participation (+20)
        in_multihop = any(
            tp.hop_count >= 3 and any(h.from_entity == node.id or h.to_entity == node.id for h in tp.hops)
            for tp in temporal_paths
        )
        if in_multihop:
            components["multi_hop_chain"] = 20.0

        # High Volume Retention (+20)
        if node.id in high_retention_mules:
            components["high_retention"] = 20.0

        # Cash-out Endpoint (+20)
        if node.id in cashout_endpoints:
            components["cashout_endpoint"] = 20.0

        # Hardware / Device Reuse (+15)
        if node.id in reused_devices or node.id in phones_with_reused_devices:
            components["device_reuse"] = 15.0

        # Cross-Artifact Match (+10)
        if len(sources_per_entity.get(node.id, set())) >= 2:
            components["cross_artifact_correlation"] = 10.0

        # Weak Infrastructure Penalty (-10)
        e_types = entity_edge_types.get(node.id, set())
        if e_types == {"IP_SESSION"}:
            components["ambient_infra_penalty"] = -10.0

        total_score = sum(components.values())
        clamped_score = max(5.0, min(99.0, total_score)) if components else 10.0

        # Determine qualitative risk level
        if clamped_score >= RISK_THRESHOLDS["HIGH"][0]:
            level = "HIGH"
        elif clamped_score >= RISK_THRESHOLDS["MEDIUM"][0]:
            level = "MEDIUM"
        else:
            level = "LOW"

        node.risk_score = round(clamped_score, 1)
        node.risk_level = level
        node.component_scores = components

    return nodes
