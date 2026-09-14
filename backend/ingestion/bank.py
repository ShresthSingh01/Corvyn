import csv
from pathlib import Path
from typing import List, Set
from backend.models.schemas import CanonicalEvent, EventType
from backend.ingestion.normalize import normalize_upi, normalize_account, normalize_timestamp, clean_ip
from backend.core.hashing import hash_file
from backend.ingestion.cdr import find_column

def parse_bank_file(file_path: Path | str) -> List[CanonicalEvent]:
    """
    Parse Bank and UPI settlement sheet CSV.
    Extracts transaction flows, Account-UPI links, and Account-IP links.
    Deduplicates transactions by transaction_id to prevent double-counting.
    """
    path = Path(file_path)
    file_hash = hash_file(path)
    events: List[CanonicalEvent] = []
    seen_tx_ids: Set[str] = set()

    with open(path, mode="r", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            return events

        fields = reader.fieldnames
        col_tx_id = find_column(fields, ["transaction_id", "txn_id", "tx_id", "reference_no", "rrn", "utr", "ref_no", "tran_id", "journal_no"])
        col_time = find_column(fields, ["timestamp", "datetime", "tx_time", "txn_date", "date_time", "date", "posting_date", "value_date", "time"])
        col_sender_acc = find_column(fields, ["sender_account", "from_account", "remitter_account", "source_acc", "debit_account", "account_no", "acc_no", "payer_account", "source_account"])
        col_recv_acc = find_column(fields, ["receiver_account", "to_account", "beneficiary_account", "dest_acc", "credit_account", "beneficiary_acc", "payee_account"])
        col_sender_upi = find_column(fields, ["sender_upi", "remitter_vpa", "sender_vpa", "payer_vpa", "remitter_upi", "from_vpa"])
        col_recv_upi = find_column(fields, ["receiver_upi", "beneficiary_vpa", "payee_vpa", "receiver_vpa", "to_vpa", "beneficiary_upi"])
        col_amount = find_column(fields, ["amount", "txn_amount", "tx_amount", "sum", "debit", "credit", "net_amount", "value", "transaction_amount"])
        col_status = find_column(fields, ["status", "txn_status", "state", "result"])
        col_ip = find_column(fields, ["ip", "ip_address", "client_ip", "sender_ip", "user_ip"])


        for row_idx, row in enumerate(reader, start=2):
            status = row.get(col_status, "").strip().upper() if col_status else "SUCCESS"
            # Ignore failed transactions if explicit status column exists
            if status in ("FAILED", "DECLINED", "REJECTED"):
                continue

            tx_id = row.get(col_tx_id, "").strip() if col_tx_id else f"ROW_{row_idx}"
            if tx_id:
                if tx_id in seen_tx_ids:
                    # Deduplicate repeated rows
                    continue
                seen_tx_ids.add(tx_id)

            time_raw = row.get(col_time, "") if col_time else ""
            norm_time = normalize_timestamp(time_raw)

            # Amounts
            amt_raw = row.get(col_amount, "0") if col_amount else "0"
            try:
                amount = float(str(amt_raw).replace(",", "").strip())
            except ValueError:
                amount = 0.0

            # Entities
            s_acc = normalize_account(row.get(col_sender_acc, "") if col_sender_acc else "")
            r_acc = normalize_account(row.get(col_recv_acc, "") if col_recv_acc else "")
            s_upi = normalize_upi(row.get(col_sender_upi, "") if col_sender_upi else "")
            r_upi = normalize_upi(row.get(col_recv_upi, "") if col_recv_upi else "")
            ip = clean_ip(row.get(col_ip, "") if col_ip else "")

            # Primary sender / receiver node representations
            sender_id = f"ACCOUNT:{s_acc}" if s_acc else (f"UPI:{s_upi}" if s_upi else None)
            receiver_id = f"ACCOUNT:{r_acc}" if r_acc else (f"UPI:{r_upi}" if r_upi else None)

            # 1. Money Transfer Event
            if sender_id and receiver_id:
                events.append(
                    CanonicalEvent(
                        timestamp=norm_time,
                        source_type="BANK",
                        entity_a=sender_id,
                        entity_b=receiver_id,
                        event_type=EventType.TRANSACTION,
                        amount=amount,
                        metadata={
                            "tx_id": tx_id,
                            "sender_account": s_acc,
                            "receiver_account": r_acc,
                            "sender_upi": s_upi,
                            "receiver_upi": r_upi,
                            "ip": ip,
                        },
                        evidence_file=path.name,
                        evidence_row=row_idx,
                        evidence_hash=file_hash,
                    )
                )

            # 2. Account <-> UPI Association
            if s_acc and s_upi:
                events.append(
                    CanonicalEvent(
                        timestamp=norm_time,
                        source_type="BANK",
                        entity_a=f"ACCOUNT:{s_acc}",
                        entity_b=f"UPI:{s_upi}",
                        event_type=EventType.DEVICE_USE,
                        metadata={"tx_id": tx_id},
                        evidence_file=path.name,
                        evidence_row=row_idx,
                        evidence_hash=file_hash,
                    )
                )
            if r_acc and r_upi:
                events.append(
                    CanonicalEvent(
                        timestamp=norm_time,
                        source_type="BANK",
                        entity_a=f"ACCOUNT:{r_acc}",
                        entity_b=f"UPI:{r_upi}",
                        event_type=EventType.DEVICE_USE,
                        metadata={"tx_id": tx_id},
                        evidence_file=path.name,
                        evidence_row=row_idx,
                        evidence_hash=file_hash,
                    )
                )

            # 3. Account <-> IP Association
            if s_acc and ip:
                events.append(
                    CanonicalEvent(
                        timestamp=norm_time,
                        source_type="BANK",
                        entity_a=f"ACCOUNT:{s_acc}",
                        entity_b=f"IP:{ip}",
                        event_type=EventType.IP_SESSION,
                        metadata={"tx_id": tx_id},
                        evidence_file=path.name,
                        evidence_row=row_idx,
                        evidence_hash=file_hash,
                    )
                )

    return events
