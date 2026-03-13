"""Demo utility endpoints.

Routes:
    POST /api/demo/reset — wipe all runtime data and re-seed from mock files
"""

import logging
from typing import Any, Dict

from fastapi import APIRouter

from services import storage_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.post("/reset")
async def reset_demo() -> Dict[str, Any]:
    """Wipe all runtime collections and reload seed data.

    Clears: smes, needs, matches, gaps, applications, notifications.
    Then re-seeds smes, needs, and applications from mock files.

    Returns:
        Dict with cleared counts and seeded counts.
    """
    # 1 — Clear every runtime collection
    cleared: Dict[str, int] = {}
    for collection in ["smes", "needs", "matches", "gaps", "applications", "notifications"]:
        current = storage_service.load_all(collection)
        cleared[collection] = len(current)
        storage_service.replace_all(collection, [])

    logger.info("Demo reset — cleared: %s", cleared)

    # 2 — Re-seed from mock files (force even if non-empty won't matter, they're empty now)
    seeded = storage_service.seed_from_mock_data()

    logger.info("Demo reset — seeded: %s", seeded)

    return {
        "success": True,
        "message": "Demo réinitialisée avec succès",
        "cleared": cleared,
        "seeded": seeded,
    }
