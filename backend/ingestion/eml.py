import email
from email import policy
import re
from pathlib import Path
from typing import List
from backend.models.schemas import CanonicalEvent, EventType
from backend.ingestion.normalize import clean_ip, normalize_timestamp
from backend.core.hashing import hash_file

def parse_eml_file(file_path: Path | str) -> List[CanonicalEvent]:
    """
    Parse .eml email header file for cyber fraud / phishing infrastructure investigation.
    Extracts sender emails, recipient emails, originating IPs, and Received: server hop IPs.
    """
    path = Path(file_path)
    file_hash = hash_file(path)
    events: List[CanonicalEvent] = []

    with open(path, "rb") as f:
        msg = email.message_from_binary_file(f, policy=policy.default)

    date_str = msg.get("Date", "")
    norm_time = normalize_timestamp(date_str)

    sender = msg.get("From", "")
    reply_to = msg.get("Reply-To", "")
    recipient = msg.get("To", "")
    subject = msg.get("Subject", "")

    def extract_email(addr_str: str) -> str:
        match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', str(addr_str))
        return match.group(0).lower() if match else ""

    from_email = extract_email(sender)
    reply_email = extract_email(reply_to) or from_email
    to_email = extract_email(recipient)

    # 1. Email Sender <-> Target/Receiver link
    if from_email and to_email:
        events.append(
            CanonicalEvent(
                timestamp=norm_time,
                source_type="EML",
                entity_a=f"EMAIL:{from_email}",
                entity_b=f"EMAIL:{to_email}",
                event_type=EventType.CALL,
                amount=None,
                metadata={
                    "subject": subject,
                    "reply_to": reply_email,
                    "from_raw": sender,
                },
                evidence_file=path.name,
                evidence_row=1,
                evidence_hash=file_hash,
            )
        )

    # Extract IPs from X-Originating-IP and Received headers
    ip_list = []
    for h in ["X-Originating-IP", "X-Sender-IP", "X-Remote-IP", "X-Client-IP"]:
        val = msg.get(h)
        if val:
            ip_clean = clean_ip(val.strip("[] "))
            if ip_clean:
                ip_list.append(ip_clean)

    # Extract IPs from Received headers
    received_headers = msg.get_all("Received", [])
    for r_hdr in received_headers:
        found_ips = re.findall(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', str(r_hdr))
        for ip in found_ips:
            c_ip = clean_ip(ip)
            if c_ip and c_ip not in ip_list and not c_ip.startswith("127.") and not c_ip.startswith("10."):
                ip_list.append(c_ip)

    # 2. Email <-> Originating/Relay IP links
    for idx, ip in enumerate(ip_list, start=1):
        if from_email:
            events.append(
                CanonicalEvent(
                    timestamp=norm_time,
                    source_type="EML",
                    entity_a=f"EMAIL:{from_email}",
                    entity_b=f"IP:{ip}",
                    event_type=EventType.IP_SESSION,
                    metadata={"hop_index": idx, "subject": subject},
                    evidence_file=path.name,
                    evidence_row=idx + 1,
                    evidence_hash=file_hash,
                )
            )

    return events
