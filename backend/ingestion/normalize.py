import re
from datetime import datetime

PHONE_CLEAN_REGEX = re.compile(r"[^\d]")

def normalize_phone(raw: str | None) -> str:
    """Normalize phone numbers to canonical 10-digit Indian MSISDN."""
    if not raw:
        return ""
    digits = PHONE_CLEAN_REGEX.sub("", str(raw))
    # If starts with country code 91 and has 12 digits
    if len(digits) == 12 and digits.startswith("91"):
        return digits[2:]
    # If starts with leading 0 and has 11 digits
    if len(digits) == 11 and digits.startswith("0"):
        return digits[1:]
    # Last 10 digits if length >= 10
    if len(digits) >= 10:
        return digits[-10:]
    return digits

def normalize_upi(raw: str | None) -> str:
    """Normalize UPI IDs to lowercase trimmed string."""
    if not raw:
        return ""
    return str(raw).strip().lower()

def normalize_account(raw: str | None) -> str:
    """Normalize bank account numbers by stripping formatting characters."""
    if not raw:
        return ""
    return re.sub(r"[\s\-_]", "", str(raw)).strip().upper()

def normalize_timestamp(raw: str | None) -> str:
    """
    Standardize various timestamp formats into ISO 8601 (YYYY-MM-DDTHH:MM:SS).
    Handles ISO, DD/MM/YYYY, DD-MM-YYYY, YYYY/MM/DD formats.
    """
    if not raw:
        return ""
    raw_str = str(raw).strip()
    
    # Common formats
    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y %H:%M",
        "%d-%m-%Y %H:%M:%S",
        "%d-%m-%Y %H:%M",
        "%Y/%m/%d %H:%M:%S",
    ]
    
    for fmt in formats:
        try:
            dt = datetime.strptime(raw_str, fmt)
            return dt.isoformat()
        except ValueError:
            continue
            
    # ponytail: if format is unknown or partial, keep raw string as fallback
    return raw_str

def clean_imei(raw: str | None) -> str | None:
    """Validate and clean IMEI. Return None if null, empty, or placeholder."""
    if not raw:
        return None
    val = re.sub(r"[^\d]", "", str(raw).strip())
    if not val or val.lower() in ("null", "none", "0", "000000000000000"):
        return None
    if len(val) < 10:
        return None
    return val

def clean_ip(raw: str | None) -> str | None:
    """Clean IP address. Return None if placeholder or invalid."""
    if not raw:
        return None
    val = str(raw).strip()
    if val.lower() in ("null", "none", "", "0.0.0.0", "127.0.0.1"):
        return None
    return val
