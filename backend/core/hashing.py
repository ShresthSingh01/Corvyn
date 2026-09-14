import hashlib
from pathlib import Path

def hash_file(file_path: str | Path) -> str:
    """Compute SHA-256 hash of a file for evidentiary integrity."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            sha256.update(chunk)
    return sha256.hexdigest()

def hash_bytes(data: bytes) -> str:
    """Compute SHA-256 hash of in-memory bytes."""
    return hashlib.sha256(data).hexdigest()
