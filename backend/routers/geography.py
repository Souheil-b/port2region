"""Geography reference data endpoints.

Routes:
    GET /api/regions           — list all regions
    GET /api/ports             — list all ports (optional ?region_id= filter)
"""

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Query

from services import storage_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["geography"])


def _ok(data: Any) -> Dict[str, Any]:
    """Wrap data in the standard success envelope.

    Args:
        data (Any): Response payload.

    Returns:
        Dict[str, Any]: {"success": True, "data": data}.
    """
    return {"success": True, "data": data}


def _err(message: str) -> Dict[str, Any]:
    """Wrap a message in the standard error envelope.

    Args:
        message (str): Human-readable error message.

    Returns:
        Dict[str, Any]: {"success": False, "error": message}.
    """
    return {"success": False, "error": message}


@router.get("/regions", response_model=Dict[str, Any])
def list_regions() -> Dict[str, Any]:
    """Return all geographic regions.

    Returns:
        Dict[str, Any]: List of region records wrapped in success envelope.
    """
    try:
        regions = storage_service.load_all("regions")
        return _ok(regions)
    except Exception as exc:
        logger.error("Failed to load regions: %s", exc)
        return _err("Failed to load regions.")


@router.get("/ports", response_model=Dict[str, Any])
def list_ports(
    region_id: Optional[str] = Query(default=None, description="Filter ports by region ID"),
) -> Dict[str, Any]:
    """Return all active ports, optionally filtered by region.

    Args:
        region_id (Optional[str]): Region ID to filter by.

    Returns:
        Dict[str, Any]: List of port records wrapped in success envelope.
    """
    try:
        ports = storage_service.load_all("ports")
        active_ports = [p for p in ports if p.get("is_active", True)]
        if region_id:
            active_ports = [p for p in active_ports if p.get("region_id") == region_id]
        return _ok(active_ports)
    except Exception as exc:
        logger.error("Failed to load ports: %s", exc)
        return _err("Failed to load ports.")
