import tempfile
import csv
from pathlib import Path
from typing import List
import openpyxl
from backend.models.schemas import CanonicalEvent
from backend.ingestion.bank import parse_bank_file
from backend.ingestion.cdr import parse_cdr_file

def parse_excel_file(file_path: Path | str) -> List[CanonicalEvent]:
    """
    Parse Excel (.xlsx, .xls) files containing bank statements or CDR records.
    Finds header rows dynamically (skipping title rows/metadata) and delegating to bank/cdr logic.
    """
    path = Path(file_path)
    wb = openpyxl.load_workbook(path, data_only=True)
    all_rows = []

    for sheet_name in wb.sheetnames:
        sheet = wb[sheet_name]
        sheet_rows = list(sheet.iter_rows(values_only=True))
        if not sheet_rows:
            continue

        # Find header row
        header_idx = -1
        for idx, r in enumerate(sheet_rows):
            r_str = " ".join([str(cell).lower() for cell in r if cell is not None])
            if any(kw in r_str for kw in ["amount", "txn", "transaction", "caller", "callee", "account", "upi", "sender", "receiver", "date"]):
                header_idx = idx
                break
        
        if header_idx == -1:
            header_idx = 0

        headers = [str(c).strip() if c is not None else f"col_{i}" for i, c in enumerate(sheet_rows[header_idx])]
        
        for r in sheet_rows[header_idx + 1:]:
            if not r or all(c is None for c in r):
                continue
            row_dict = {}
            for idx, val in enumerate(r):
                if idx < len(headers):
                    row_dict[headers[idx]] = str(val).strip() if val is not None else ""
            if any(row_dict.values()):
                all_rows.append(row_dict)

    if not all_rows:
        return []

    # Write to temp CSV to pass through standard parsers
    temp_csv = path.with_name(f"_temp_{path.name}.csv")
    fieldnames = list(all_rows[0].keys())
    with open(temp_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)

    try:
        # Check header line for CDR vs Bank
        header_line = " ".join(fieldnames).lower()
        if any(k in header_line for k in ["caller", "callee", "calling", "called", "imei", "duration"]):
            events = parse_cdr_file(temp_csv)
        else:
            events = parse_bank_file(temp_csv)
        
        # Override evidence_file to original Excel filename
        for ev in events:
            ev.evidence_file = path.name

        return events
    finally:
        if temp_csv.exists():
            try:
                temp_csv.unlink()
            except Exception:
                pass
