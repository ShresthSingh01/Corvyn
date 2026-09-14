import csv
from pathlib import Path
from typing import List
from backend.models.schemas import CanonicalEvent, EventType
from backend.ingestion.normalize import normalize_phone, normalize_timestamp, clean_imei
from backend.core.hashing import hash_file

def find_column(headers: List[str], candidates: List[str]) -> str | None:
    """Case-insensitive column matching."""
    header_map = {h.strip().lower(): h for h in headers}
    for c in candidates:
        if c.lower() in header_map:
            return header_map[c.lower()]
    return None

def parse_cdr_file(file_path: Path | str) -> List[CanonicalEvent]:
    """
    Parse telecom CDR (Call Detail Record) CSV file.
    Extracts call events and caller-device (IMEI) associations.
    Guarantees evidentiary hash tracking per record.
    """
    path = Path(file_path)
    file_hash = hash_file(path)
    events: List[CanonicalEvent] = []

    with open(path, mode="r", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            return events

        fields = reader.fieldnames
        col_caller = find_column(fields, ["caller", "calling_number", "calling_no", "source", "from", "a_party", "caller_num", "originating_number", "from_number"])
        col_callee = find_column(fields, ["callee", "called_number", "called_no", "destination", "to", "b_party", "callee_num", "terminating_number", "to_number"])
        col_time = find_column(fields, ["timestamp", "datetime", "call_time", "date_time", "time", "date", "call_date", "start_time"])
        col_duration = find_column(fields, ["duration", "call_duration", "duration_sec", "seconds", "dur", "call_dur"])
        col_imei = find_column(fields, ["imei", "device_imei", "calling_imei", "imei_number", "a_imei", "b_imei"])
        col_imsi = find_column(fields, ["imsi", "calling_imsi", "imsi_number", "a_imsi"])
        col_cell = find_column(fields, ["cell_id", "tower_id", "first_cell_id", "cgi", "cell", "location_id", "lac"])


        for row_idx, row in enumerate(reader, start=2):
            caller_raw = row.get(col_caller, "") if col_caller else ""
            callee_raw = row.get(col_callee, "") if col_callee else ""
            caller = normalize_phone(caller_raw)
            callee = normalize_phone(callee_raw)

            if not caller and not callee:
                continue

            time_raw = row.get(col_time, "") if col_time else ""
            norm_time = normalize_timestamp(time_raw)
            
            imei = clean_imei(row.get(col_imei, "")) if col_imei else None
            imsi = row.get(col_imsi, "").strip() if col_imsi else None
            cell = row.get(col_cell, "").strip() if col_cell else None
            duration = row.get(col_duration, "0") if col_duration else "0"

            # 1. Primary Call Event
            if caller and callee:
                events.append(
                    CanonicalEvent(
                        timestamp=norm_time,
                        source_type="CDR",
                        entity_a=f"PHONE:{caller}",
                        entity_b=f"PHONE:{callee}",
                        event_type=EventType.CALL,
                        amount=None,
                        metadata={
                            "duration_sec": duration,
                            "cell_id": cell,
                            "caller_raw": caller_raw,
                            "callee_raw": callee_raw,
                        },
                        evidence_file=path.name,
                        evidence_row=row_idx,
                        evidence_hash=file_hash,
                    )
                )

            # 2. Caller <-> Device (IMEI) Association
            if caller and imei:
                events.append(
                    CanonicalEvent(
                        timestamp=norm_time,
                        source_type="CDR",
                        entity_a=f"PHONE:{caller}",
                        entity_b=f"IMEI:{imei}",
                        event_type=EventType.DEVICE_USE,
                        metadata={"imsi": imsi, "cell_id": cell},
                        evidence_file=path.name,
                        evidence_row=row_idx,
                        evidence_hash=file_hash,
                    )
                )

    return events
