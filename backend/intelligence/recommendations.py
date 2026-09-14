from typing import List
from backend.models.schemas import GraphNode, NextBestAction

def generate_investigative_recommendations(nodes: List[GraphNode], top_n: int = 5) -> List[NextBestAction]:
    """
    Ranks next-best actions for field investigating officers.
    Priority = node_risk * uncertainty * centrality.
    Generates actionable, police-standard procedural directives (e.g. 91 CrPC, freeze notices).
    """
    candidates = []

    for node in nodes:
        if node.risk_score < 30.0:
            continue

        centrality = node.metadata.get("degree_centrality", 0.1) or 0.1
        # Uncertainty: higher if identity is unverified or device linkage is incomplete
        uncertainty = 0.9 if node.type in ("PHONE", "ACCOUNT") else 0.7

        priority_score = round((node.risk_score * uncertainty * (1.0 + centrality)), 2)

        action_text = ""
        reason = ""

        if node.type == "ACCOUNT":
            if node.is_mule_candidate:
                action_text = f"Issue Urgent Lien / Freeze Notice (Sec 91 CrPC) for {node.label}"
                reason = f"Primary intermediary mule routing high-velocity funds. Risk: {node.risk_score}."
            else:
                action_text = f"Subpoena KYC & Account Statement from Bank for {node.label}"
                reason = f"Significant fund recipient with high network centrality ({centrality})."
        elif node.type == "UPI":
            action_text = f"Request PSP / NPCI Gateway Freeze for UPI VPA {node.label}"
            reason = f"Rapid transit handle observed in fraud forwarding chain. Risk: {node.risk_score}."
        elif node.type == "PHONE":
            if "device_reuse" in node.component_scores:
                action_text = f"Subpoena CAF (Customer Application Form) & Tower CDR for {node.label}"
                reason = "Phone number linked to hardware device (IMEI) utilized across multiple syndicate accounts."
            else:
                action_text = f"Request Cell Tower Triangulation & CDR for {node.label}"
                reason = f"Frequent voice contact with target mule endpoints during transfer window."
        elif node.type == "IMEI":
            action_text = f"Blacklist IMEI {node.label} on CEIR (Central Equipment Identity Register)"
            reason = "Multi-SIM handset flagged for syndicate mule coordination."
        else:
            action_text = f"Verify identity and physical endpoint for {node.label}"
            reason = f"High-risk correlated entity ({node.risk_score})."

        candidates.append({
            "target_entity": node.id,
            "action_text": action_text,
            "reason": reason,
            "priority_score": priority_score,
            "risk_score": node.risk_score,
        })

    # Sort candidates by priority score descending
    candidates.sort(key=lambda c: (c["priority_score"], c["risk_score"]), reverse=True)

    recommendations: List[NextBestAction] = []
    for rank, cand in enumerate(candidates[:top_n], start=1):
        recommendations.append(
            NextBestAction(
                priority_rank=rank,
                target_entity=cand["target_entity"],
                action_text=cand["action_text"],
                reason=cand["reason"],
                priority_score=cand["priority_score"],
            )
        )

    return recommendations
