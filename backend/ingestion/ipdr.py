import csv
from pathlib import Path
from typing import List
from backend.models.schemas import CanonicalEvent, EventType
from backend.ingestion.normalize import normalize_phone, clean_ip, normalize_timestamp
from backend.core.hashing import hash_file
from backend.ingestion.cdr import find_column

def parse_ipdr_file(file_path: Path | str) -> List[CanonicalEvent]:
    """
    Parse IPDR (IP Detail Records) CSV file linking mobile MSISDNs to IP session logs.
    """
    path = Path(file_path)
    file_hash = hash_file(path)
    events: List[CanonicalEvent] = []

    with open(path, mode="r", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            return events

        fields = reader.fieldnames
        col_phone = find_column(fields, ["msisdn", "phone", "calling_number", "mobile_no", "phone_number"])
        col_ip = find_column(fields, ["ip_address", "ip", "client_ip", "source_ip", "dest_ip"])
        col_time = find_column(fields, ["session_start", "timestamp", "datetime", "start_time", "date_time"])
        col_cell = find_column(fields, ["cell_id", "cgi", "location_id", "tower_id"])
        col_vol = find_column(fields, ["data_volume", "bytes", "volume_mb", "usage_bytes"])

        for row_idx, row in enumerate(reader, start=2):
            phone_raw = row.get(col_phone, "") if col_phone else ""
            ip_raw = row.get(col_ip, "") if col_ip else ""
            phone = normalize_phone(phone_raw)
            ip = clean_ip(ip_raw)

            if not phone or not ip:
                continue

            time_raw = row.get(col_time, "") if col_time else ""
            norm_time = normalize_timestamp(time_raw)
            cell = row.get(col_cell, "").strip() if col_cell else None
            vol = row.get(col_vol, "").strip() if col_vol else None

            events.append(
                CanonicalEvent(
                    timestamp=norm_time,
                    source_type="IPDR",
                    entity_a=f"PHONE:{phone}",
                    entity_b=f"IP:{ip}",
                    event_type=EventType.IP_SESSION,
                    amount=None,
                    metadata={
                        "cell_id": cell,
                        "data_volume": vol,
                        "raw_phone": phone_raw,
                    },
                    evidence_file=path.name,
                    evidence_row=row_idx,
                    evidence_hash=file_hash,
                )
            )

    return events
