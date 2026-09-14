import json
import re
from pathlib import Path
from typing import List
from backend.models.schemas import CanonicalEvent, EventType
from backend.ingestion.normalize import normalize_phone, clean_imei, clean_ip, normalize_timestamp
from backend.core.hashing import hash_file

SUSPICIOUS_APK_KEYWORDS = ["mule", "phish", "stealer", "rat", "apk_pay", "sbi_verify", "custom_banking", "remote_access", "anydesk", "teamviewer"]

def parse_android_dump(file_path: Path | str) -> List[CanonicalEvent]:
    """
    Parse Android device/APK forensic dump (.json or .txt logs).
    Extracts IMEI, MAC address, SIM phone number, IP sessions, and suspicious app contacts.
    """
    path = Path(file_path)
    file_hash = hash_file(path)
    events: List[CanonicalEvent] = []

    content = ""
    try:
        with open(path, "r", encoding="utf-8-sig", errors="replace") as f:
            content = f.read()
    except Exception:
        return events

    is_json = path.suffix.lower() == ".json" or content.strip().startswith("{")

    if is_json:
        try:
            data = json.loads(content)
            phone = normalize_phone(str(data.get("phone_number", "") or data.get("msisdn", "")))
            imei = clean_imei(str(data.get("imei", "") or data.get("device_imei", "")))
            mac = str(data.get("mac_address", "") or data.get("wifi_mac", "")).strip()
            ip = clean_ip(str(data.get("ip_address", "") or data.get("wifi_ip", "")))
            timestamp = normalize_timestamp(str(data.get("dump_timestamp", "") or data.get("created_at", "")))

            # 1. PHONE <-> IMEI
            if phone and imei:
                events.append(
                    CanonicalEvent(
                        timestamp=timestamp,
                        source_type="ANDROID",
                        entity_a=f"PHONE:{phone}",
                        entity_b=f"IMEI:{imei}",
                        event_type=EventType.DEVICE_USE,
                        metadata={"source": "android_dump_json"},
                        evidence_file=path.name,
                        evidence_row=1,
                        evidence_hash=file_hash,
                    )
                )

            # 2. IMEI <-> MAC
            if imei and mac:
                events.append(
                    CanonicalEvent(
                        timestamp=timestamp,
                        source_type="ANDROID",
                        entity_a=f"IMEI:{imei}",
                        entity_b=f"MAC:{mac}",
                        event_type=EventType.DEVICE_USE,
                        metadata={"mac_address": mac},
                        evidence_file=path.name,
                        evidence_row=1,
                        evidence_hash=file_hash,
                    )
                )

            # 3. PHONE <-> IP
            if phone and ip:
                events.append(
                    CanonicalEvent(
                        timestamp=timestamp,
                        source_type="ANDROID",
                        entity_a=f"PHONE:{phone}",
                        entity_b=f"IP:{ip}",
                        event_type=EventType.IP_SESSION,
                        metadata={"ip": ip},
                        evidence_file=path.name,
                        evidence_row=1,
                        evidence_hash=file_hash,
                    )
                )

            # 4. Contacts / App connections
            contacts = data.get("contacts", [])
            if isinstance(contacts, list):
                for idx, c in enumerate(contacts, start=2):
                    c_phone = normalize_phone(str(c.get("number", "") if isinstance(c, dict) else c))
                    if phone and c_phone:
                        events.append(
                            CanonicalEvent(
                                timestamp=timestamp,
                                source_type="ANDROID",
                                entity_a=f"PHONE:{phone}",
                                entity_b=f"PHONE:{c_phone}",
                                event_type=EventType.CALL,
                                metadata={"type": "android_contact_book"},
                                evidence_file=path.name,
                                evidence_row=idx,
                                evidence_hash=file_hash,
                            )
                        )

            # Suspicious apps check
            installed_apps = data.get("installed_apps", [])
            suspicious_found = []
            if isinstance(installed_apps, list):
                for app in installed_apps:
                    app_name = str(app.get("name", "") if isinstance(app, dict) else app).lower()
                    if any(k in app_name for k in SUSPICIOUS_APK_KEYWORDS):
                        suspicious_found.append(app_name)
            
            if suspicious_found and phone:
                for idx, app_name in enumerate(suspicious_found, start=100):
                    events.append(
                        CanonicalEvent(
                            timestamp=timestamp,
                            source_type="ANDROID",
                            entity_a=f"PHONE:{phone}",
                            entity_b=f"SUSPICIOUS_APK:{app_name}",
                            event_type=EventType.DEVICE_USE,
                            metadata={"app": app_name, "risk_indicator": "HIGH_SUSPICION_MALWARE"},
                            evidence_file=path.name,
                            evidence_row=idx,
                            evidence_hash=file_hash,
                        )
                    )

        except Exception:
            pass
    else:
        # Text dump regex extraction
        imeis = re.findall(r'\b\d{15}\b', content)
        phones = [normalize_phone(p) for p in re.findall(r'\b[6-9]\d{9}\b', content)]
        phones = [p for p in phones if p]
        ips = [clean_ip(ip) for ip in re.findall(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', content)]
        ips = [ip for ip in ips if ip and not ip.startswith("127.")]

        first_phone = phones[0] if phones else None
        first_imei = clean_imei(imeis[0]) if imeis else None
        first_ip = ips[0] if ips else None

        if first_phone and first_imei:
            events.append(
                CanonicalEvent(
                    timestamp=normalize_timestamp(""),
                    source_type="ANDROID",
                    entity_a=f"PHONE:{first_phone}",
                    entity_b=f"IMEI:{first_imei}",
                    event_type=EventType.DEVICE_USE,
                    metadata={"source": "android_txt_log"},
                    evidence_file=path.name,
                    evidence_row=1,
                    evidence_hash=file_hash,
                )
            )

        if first_phone and first_ip:
            events.append(
                CanonicalEvent(
                    timestamp=normalize_timestamp(""),
                    source_type="ANDROID",
                    entity_a=f"PHONE:{first_phone}",
                    entity_b=f"IP:{first_ip}",
                    event_type=EventType.IP_SESSION,
                    metadata={"source": "android_txt_log"},
                    evidence_file=path.name,
                    evidence_row=2,
                    evidence_hash=file_hash,
                )
            )

    return events
