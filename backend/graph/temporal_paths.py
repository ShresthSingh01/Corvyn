from datetime import datetime
from typing import List, Dict, Any, Tuple
from backend.models.schemas import CanonicalEvent, EventType, TemporalPath, TemporalHop
from backend.core.config import RAPID_FORWARD_WINDOW_SECONDS, MAX_FORWARD_HOPS

def parse_epoch(ts: str) -> float | None:
    """Parse ISO timestamp string to epoch seconds."""
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts).timestamp()
    except Exception:
        return None

def detect_temporal_forwarding_paths(
    events: List[CanonicalEvent],
    window_seconds: float = RAPID_FORWARD_WINDOW_SECONDS,
    max_hops: int = MAX_FORWARD_HOPS,
) -> List[TemporalPath]:
    """
    Core Forensic Algorithm:
    Detects rapid fund forwarding chains across mule networks:
    Victim -> Mule A -> Mule B -> Cash-out endpoint
    satisfying directional temporal constraints (t2 >= t1, delta <= window)
    and volume retention constraints (50% - 105% forwarded).
    """
    # 1. Filter and parse valid money transactions
    txs: List[Dict[str, Any]] = []
    for ev in events:
        if ev.event_type != EventType.TRANSACTION or not ev.amount or ev.amount <= 0:
            continue
        epoch = parse_epoch(ev.timestamp)
        if epoch is None:
            continue
        txs.append({
            "from": ev.entity_a,
            "to": ev.entity_b,
            "amount": ev.amount,
            "timestamp": ev.timestamp,
            "epoch": epoch,
            "tx_id": ev.metadata.get("tx_id", ""),
        })

    # Sort chronologically
    txs.sort(key=lambda x: x["epoch"])

    # Build adjacency list: node -> outgoing txs
    outgoing: Dict[str, List[Dict[str, Any]]] = {}
    for tx in txs:
        outgoing.setdefault(tx["from"], []).append(tx)

    found_chains: List[List[Dict[str, Any]]] = []

    def dfs(current_path: List[Dict[str, Any]], visited_entities: set):
        if len(current_path) >= max_hops:
            found_chains.append(current_path)
            return

        last_tx = current_path[-1]
        next_sender = last_tx["to"]
        candidates = outgoing.get(next_sender, [])
        expanded = False

        for candidate in candidates:
            time_delta = candidate["epoch"] - last_tx["epoch"]
            # Temporal window: forward must happen after arrival within rapid forwarding window
            if 0 <= time_delta <= window_seconds:
                # Retention window: money forwarded is between 50% and 105% of incoming
                ratio = candidate["amount"] / last_tx["amount"]
                if 0.50 <= ratio <= 1.05:
                    if candidate["to"] not in visited_entities:
                        expanded = True
                        visited_entities.add(candidate["to"])
                        dfs(current_path + [candidate], visited_entities)
                        visited_entities.remove(candidate["to"])

        # If couldn't expand further and chain has >= 2 hops (at least 3 entities involved)
        if not expanded and len(current_path) >= 2:
            found_chains.append(current_path)

    # Start DFS from every transaction
    for tx in txs:
        dfs([tx], {tx["from"], tx["to"]})

    # Deduplicate sub-chains: keep maximal chains
    found_chains.sort(key=lambda c: len(c), reverse=True)
    maximal_chains: List[List[Dict[str, Any]]] = []
    
    for chain in found_chains:
        chain_tx_ids = [c["tx_id"] for c in chain]
        is_sub = False
        for m in maximal_chains:
            m_tx_ids = [c["tx_id"] for c in m]
            # Check if chain is a subsegment of an existing maximal chain
            if "".join(chain_tx_ids) in "".join(m_tx_ids):
                is_sub = True
                break
        if not is_sub:
            maximal_chains.append(chain)

    # Convert to TemporalPath models
    result_paths: List[TemporalPath] = []
    for idx, chain in enumerate(maximal_chains, start=1):
        hops: List[TemporalHop] = []
        initial_amt = chain[0]["amount"]
        final_amt = chain[-1]["amount"]
        total_duration = chain[-1]["epoch"] - chain[0]["epoch"]

        for i, tx in enumerate(chain):
            prev_epoch = chain[i - 1]["epoch"] if i > 0 else tx["epoch"]
            delta = tx["epoch"] - prev_epoch
            hops.append(
                TemporalHop(
                    from_entity=tx["from"],
                    to_entity=tx["to"],
                    amount=tx["amount"],
                    timestamp=tx["timestamp"],
                    time_delta_seconds=delta,
                    tx_id=tx["tx_id"],
                )
            )

        retention = round((final_amt / initial_amt) * 100, 1) if initial_amt > 0 else 100.0

        result_paths.append(
            TemporalPath(
                path_id=f"PATH_{idx:02d}",
                hops=hops,
                total_duration_seconds=total_duration,
                initial_amount=initial_amt,
                final_amount=final_amt,
                retention_rate=retention,
                hop_count=len(hops),
            )
        )

    # Sort paths by loss / initial amount descending
    result_paths.sort(key=lambda p: (p.hop_count, p.initial_amount), reverse=True)
    return result_paths
