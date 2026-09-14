from typing import List
from backend.models.schemas import GraphEdge, EvidenceItem
from backend.core.config import EVIDENCE_WEIGHTS

def apply_counter_evidence_rules(edges: List[GraphEdge]) -> List[GraphEdge]:
    """
    Inspects relationships and applies forensic counter-evidence rules.
    Prevents false-positives from shared infrastructure (e.g. public Wi-Fi / CGNAT IPs).
    """
    for edge in edges:
        # Check if the relationship relies solely on IP sharing
        rules = [e.rule for e in edge.evidence if not e.is_counter_evidence]
        has_transaction = "TRANSACTION" in rules
        has_device = "SAME_IMEI" in rules or "DEVICE_USE" in rules
        has_comm = "COMMUNICATION" in rules
        is_ip_only = (rules == ["SAME_IP"]) or (len(rules) > 0 and all(r == "SAME_IP" for r in rules))

        if is_ip_only and not (has_transaction or has_device or has_comm):
            # Apply shared infrastructure penalty
            penalty = abs(EVIDENCE_WEIGHTS["SHARED_INFRASTRUCTURE_PENALTY"])
            edge.confidence = max(5.0, edge.confidence - penalty)
            edge.evidence.append(
                EvidenceItem(
                    rule="SHARED_INFRASTRUCTURE_WARNING",
                    weight=-penalty,
                    description="Shared IP alone is weak ambient evidence (likely CGNAT, public Wi-Fi, or VPN)",
                    source_file=edge.evidence[0].source_file if edge.evidence else "network",
                    source_row=edge.evidence[0].source_row if edge.evidence else 0,
                    is_counter_evidence=True,
                )
            )

        # Device reuse warning
        if "SAME_IMEI" in rules:
            edge.evidence.append(
                EvidenceItem(
                    rule="DEVICE_REUSE_CAUTION",
                    weight=0.0,
                    description="Shared hardware indicates handset reuse; requires subscriber verification",
                    source_file=edge.evidence[0].source_file if edge.evidence else "cdr",
                    source_row=edge.evidence[0].source_row if edge.evidence else 0,
                    is_counter_evidence=True,
                )
            )

    return edges
