import networkx as nx
from typing import List, Dict, Tuple
from backend.models.schemas import (
    CanonicalEvent,
    GraphNode,
    GraphEdge,
    EvidenceItem,
    TemporalPath,
    EventType,
)
from backend.core.config import EVIDENCE_WEIGHTS

def build_investigation_graph(
    events: List[CanonicalEvent],
    entity_nodes: Dict[str, GraphNode],
    temporal_paths: List[TemporalPath],
) -> Tuple[List[GraphNode], List[GraphEdge], nx.DiGraph]:
    """
    Construct multi-artifact directional forensic network.
    Aggregates links, computes evidentiary provenance, and flags fraud chains.
    """
    G = nx.DiGraph()

    # Collect fraud path hop pairs
    fraud_hops = set()
    for tp in temporal_paths:
        for hop in tp.hops:
            fraud_hops.add((hop.from_entity, hop.to_entity))

    # Add all entities as nodes
    for node_id, node in entity_nodes.items():
        G.add_node(node_id, **node.model_dump())

    # Group events by directed pair (source, target, type)
    edge_map: Dict[Tuple[str, str], Dict] = {}

    for ev in events:
        key = (ev.entity_a, ev.entity_b)
        if key not in edge_map:
            edge_map[key] = {
                "source": ev.entity_a,
                "target": ev.entity_b,
                "type": ev.event_type,
                "amount": 0.0,
                "timestamp": ev.timestamp,
                "evidence": [],
                "is_fraud_path": key in fraud_hops,
            }

        # Update aggregated values
        if ev.amount:
            edge_map[key]["amount"] += ev.amount

        # Determine evidence rule & weight
        rule = "TRANSACTION"
        weight = EVIDENCE_WEIGHTS["EXACT_TRANSACTION"]
        desc = f"Bank settlement of ₹{ev.amount:,.2f}" if ev.amount else "Bank transaction"

        if ev.event_type == EventType.CALL:
            rule = "COMMUNICATION"
            weight = EVIDENCE_WEIGHTS["REPEATED_COMMUNICATION"]
            duration = ev.metadata.get("duration_sec", "0")
            desc = f"Telecom voice call ({duration}s)"
        elif ev.event_type == EventType.DEVICE_USE:
            if "IMEI" in ev.entity_b or "IMEI" in ev.entity_a:
                rule = "SAME_IMEI"
                weight = EVIDENCE_WEIGHTS["SAME_IMEI"]
                desc = "Phone registered on device IMEI"
            else:
                rule = "ACCOUNT_UPI_LINK"
                weight = 30.0
                desc = "Account mapped to UPI handle"
        elif ev.event_type == EventType.IP_SESSION:
            rule = "SAME_IP"
            weight = EVIDENCE_WEIGHTS["SAME_IP"]
            desc = f"Session originating from IP ({ev.entity_b})"

        # If it's a temporal rapid forwarding hop, add temporal overlap evidence!
        if key in fraud_hops:
            edge_map[key]["evidence"].append(
                EvidenceItem(
                    rule="TEMPORAL_OVERLAP",
                    weight=EVIDENCE_WEIGHTS["TEMPORAL_OVERLAP"],
                    description="Rapid forwarding hop within 15-minute window",
                    source_file=ev.evidence_file,
                    source_row=ev.evidence_row,
                    is_counter_evidence=False,
                )
            )

        edge_map[key]["evidence"].append(
            EvidenceItem(
                rule=rule,
                weight=weight,
                description=desc,
                source_file=ev.evidence_file,
                source_row=ev.evidence_row,
                is_counter_evidence=False,
            )
        )

    # Build final GraphEdge models
    graph_edges: List[GraphEdge] = []
    for idx, (key, data) in enumerate(edge_map.items(), start=1):
        # Calculate raw confidence score from accumulated evidence weights
        total_weight = sum(e.weight for e in data["evidence"])
        confidence = min(98.0, max(15.0, total_weight))

        # Add edge to NetworkX graph
        G.add_edge(
            data["source"],
            data["target"],
            type=data["type"],
            confidence=confidence,
            amount=data["amount"],
            is_fraud_path=data["is_fraud_path"],
        )

        graph_edges.append(
            GraphEdge(
                id=f"EDGE_{idx:03d}",
                source=data["source"],
                target=data["target"],
                type=data["type"],
                confidence=round(confidence, 1),
                amount=round(data["amount"], 2) if data["amount"] > 0 else None,
                timestamp=data["timestamp"],
                is_fraud_path=data["is_fraud_path"],
                evidence=data["evidence"],
            )
        )

    # Compute network centrality to populate node metadata
    if len(G) > 0:
        degree_cen = nx.degree_centrality(G)
        betweenness_cen = nx.betweenness_centrality(G) if len(G) <= 500 else degree_cen

        for node_id in G.nodes:
            if node_id in entity_nodes:
                entity_nodes[node_id].metadata["degree_centrality"] = round(degree_cen.get(node_id, 0.0), 3)
                entity_nodes[node_id].metadata["betweenness_centrality"] = round(betweenness_cen.get(node_id, 0.0), 3)

    return list(entity_nodes.values()), graph_edges, G
