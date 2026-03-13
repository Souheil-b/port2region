"""JSON file persistence layer for PORT2REGION IA backend.

All runtime data is stored as JSON arrays in backend/data/*.json.
Reads and writes are wrapped in try/except as required by project standards.
"""

import json
import logging
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Global write lock to prevent concurrent corruption
_WRITE_LOCK = threading.Lock()

DATA_DIR = Path(__file__).parent.parent / "data"
SEED_DIR = DATA_DIR / "seed"

RUNTIME_FILES: Dict[str, Path] = {
    "smes": DATA_DIR / "smes.json",
    "needs": DATA_DIR / "needs.json",
    "matches": DATA_DIR / "matches.json",
    "gaps": DATA_DIR / "gaps.json",
    "applications": DATA_DIR / "applications.json",
}

SEED_FILES: Dict[str, Path] = {
    "smes": SEED_DIR / "mock_smes.json",
    "needs": SEED_DIR / "mock_needs.json",
    "applications": SEED_DIR / "mock_applications.json",
}


def _read_json_file(path: Path) -> List[Any]:
    """Read a JSON array from a file, returning an empty list on any error.

    Args:
        path (Path): Path to the JSON file.

    Returns:
        List[Any]: Parsed list, or [] on error.
    """
    try:
        with open(path, "r", encoding="utf-8") as fh:
            content = json.load(fh)
            if isinstance(content, list):
                return content
            logger.warning("Expected a JSON array in %s, got %s", path, type(content))
            return []
    except FileNotFoundError:
        logger.info("File not found, returning empty list: %s", path)
        return []
    except json.JSONDecodeError as exc:
        logger.error("JSON decode error in %s: %s", path, exc)
        return []


def _write_json_file(path: Path, data: List[Any]) -> bool:
    """Write a JSON array to a file atomically under a global lock.

    Args:
        path (Path): Destination path.
        data (List[Any]): Data to serialise.

    Returns:
        bool: True on success, False on error.
    """
    try:
        with _WRITE_LOCK:
            path.parent.mkdir(parents=True, exist_ok=True)
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(data, fh, ensure_ascii=False, indent=2, default=str)
        return True
    except (OSError, TypeError) as exc:
        logger.error("Failed to write %s: %s", path, exc)
        return False


# ---------------------------------------------------------------------------
# Public CRUD helpers
# ---------------------------------------------------------------------------


def load_all(collection: str) -> List[Dict[str, Any]]:
    """Return all records from a named collection.

    Args:
        collection (str): One of smes | needs | matches | gaps.

    Returns:
        List[Dict[str, Any]]: All records.
    """
    path = RUNTIME_FILES.get(collection)
    if path is None:
        logger.error("Unknown collection: %s", collection)
        return []
    return _read_json_file(path)


def find_by_id(collection: str, record_id: str) -> Optional[Dict[str, Any]]:
    """Find a single record by its 'id' field.

    Args:
        collection (str): Collection name.
        record_id (str): The id value to search for.

    Returns:
        Optional[Dict[str, Any]]: Matching record or None.
    """
    records = load_all(collection)
    for record in records:
        if record.get("id") == record_id:
            return record
    return None


def upsert(collection: str, record: Dict[str, Any]) -> bool:
    """Insert or replace a record (matched by 'id').

    Args:
        collection (str): Collection name.
        record (Dict[str, Any]): Record with an 'id' field.

    Returns:
        bool: True on success.
    """
    records = load_all(collection)
    target_id = record.get("id")
    updated = False
    for i, existing in enumerate(records):
        if existing.get("id") == target_id:
            records[i] = record
            updated = True
            break
    if not updated:
        records.append(record)
    path = RUNTIME_FILES[collection]
    return _write_json_file(path, records)


def delete_by_id(collection: str, record_id: str) -> bool:
    """Delete a record by its 'id' field.

    Args:
        collection (str): Collection name.
        record_id (str): ID of the record to delete.

    Returns:
        bool: True if a record was deleted, False if not found or on error.
    """
    records = load_all(collection)
    filtered = [r for r in records if r.get("id") != record_id]
    if len(filtered) == len(records):
        return False
    path = RUNTIME_FILES[collection]
    return _write_json_file(path, filtered)


def replace_all(collection: str, records: List[Dict[str, Any]]) -> bool:
    """Overwrite the entire collection with a new list.

    Args:
        collection (str): Collection name.
        records (List[Dict[str, Any]]): Replacement records.

    Returns:
        bool: True on success.
    """
    path = RUNTIME_FILES.get(collection)
    if path is None:
        return False
    return _write_json_file(path, records)


# ---------------------------------------------------------------------------
# Seed helper
# ---------------------------------------------------------------------------


def seed_from_mock_data() -> Dict[str, int]:
    """Load seed data into runtime files if they are currently empty.

    Idempotent: calling multiple times never duplicates records.

    Returns:
        Dict[str, int]: Counts of seeded records per collection, e.g.
            {"smes": 20, "needs": 5}.
    """
    seeded: Dict[str, int] = {}
    for key, seed_path in SEED_FILES.items():
        runtime_path = RUNTIME_FILES[key]
        current = _read_json_file(runtime_path)
        if current:
            logger.info("Collection '%s' already has %d records, skipping seed.", key, len(current))
            seeded[key] = 0
            continue
        mock_data = _read_json_file(seed_path)
        if not mock_data:
            logger.warning("Seed file empty or missing: %s", seed_path)
            seeded[key] = 0
            continue
        _write_json_file(runtime_path, mock_data)
        logger.info("Seeded %d records into '%s'.", len(mock_data), key)
        seeded[key] = len(mock_data)
    return seeded
