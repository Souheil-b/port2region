"""SME CRUD endpoints.

Routes:
    POST   /api/smes          — create SME (triggers Claude tag extraction)
    GET    /api/smes          — list all SMEs (optional ?region_id=, ?is_available=)
    GET    /api/smes/{sme_id} — get single SME
    PUT    /api/smes/{sme_id} — partial update SME
    DELETE /api/smes/{sme_id} — delete SME
"""

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Query

from models.sme import SME, SMECreate, SMEUpdate
from services import claude_service, storage_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/smes", tags=["smes"])


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


@router.post("", response_model=Dict[str, Any])
async def create_sme(payload: SMECreate) -> Dict[str, Any]:
    """Create a new SME and extract capability tags with Claude.

    Args:
        payload (SMECreate): New SME data.

    Returns:
        Dict[str, Any]: Created SME wrapped in success envelope.
    """
    try:
        tags, capacity_summary = await claude_service.extract_sme_tags(
            name=payload.name,
            city=payload.city,
            sector=payload.sector,
            raw_description=payload.raw_description,
        )
        sme = SME(
            name=payload.name,
            city=payload.city,
            sector=payload.sector,
            raw_description=payload.raw_description,
            tags=tags,
            capacity_summary=capacity_summary,
            region_id=payload.region_id,
            port_id=payload.port_id,
            rce=payload.rce,
            ice=payload.ice,
            is_available=payload.is_available,
        )
        storage_service.upsert("smes", sme.model_dump(mode="json"))
        logger.info("SME created: %s (%s)", sme.id, sme.name)
        return _ok(sme.model_dump(mode="json"))
    except Exception as exc:
        logger.error("Failed to create SME: %s", exc)
        return _err("Failed to create SME. Please try again.")


@router.get("", response_model=Dict[str, Any])
def list_smes(
    region_id: Optional[str] = Query(default=None, description="Filter by region ID"),
    is_available: Optional[bool] = Query(default=None, description="Filter by availability"),
) -> Dict[str, Any]:
    """Return SMEs from the data store, with optional filters.

    Args:
        region_id (Optional[str]): Filter by region identifier.
        is_available (Optional[bool]): Filter by availability status.

    Returns:
        Dict[str, Any]: List of SMEs wrapped in success envelope.
    """
    smes = storage_service.load_all("smes")
    if region_id is not None:
        smes = [s for s in smes if s.get("region_id") == region_id]
    if is_available is not None:
        smes = [s for s in smes if s.get("is_available", True) == is_available]
    return _ok(smes)


@router.get("/{sme_id}", response_model=Dict[str, Any])
def get_sme(sme_id: str) -> Dict[str, Any]:
    """Return a single SME by ID.

    Args:
        sme_id (str): SME identifier.

    Returns:
        Dict[str, Any]: SME record or error envelope.
    """
    sme = storage_service.find_by_id("smes", sme_id)
    if sme is None:
        return _err(f"SME '{sme_id}' not found.")
    return _ok(sme)


@router.put("/{sme_id}", response_model=Dict[str, Any])
def update_sme(sme_id: str, payload: SMEUpdate) -> Dict[str, Any]:
    """Partially update an existing SME.

    Args:
        sme_id (str): SME identifier.
        payload (SMEUpdate): Fields to update (unset fields are left unchanged).

    Returns:
        Dict[str, Any]: Updated SME or error envelope.
    """
    sme = storage_service.find_by_id("smes", sme_id)
    if sme is None:
        return _err(f"SME '{sme_id}' not found.")
    update_data = payload.model_dump(exclude_none=True)
    sme.update(update_data)
    storage_service.upsert("smes", sme)
    logger.info("SME updated: %s — fields: %s", sme_id, list(update_data.keys()))
    return _ok(sme)


@router.delete("/{sme_id}", response_model=Dict[str, Any])
def delete_sme(sme_id: str) -> Dict[str, Any]:
    """Delete an SME by ID.

    Args:
        sme_id (str): SME identifier.

    Returns:
        Dict[str, Any]: Confirmation or error envelope.
    """
    deleted = storage_service.delete_by_id("smes", sme_id)
    if not deleted:
        return _err(f"SME '{sme_id}' not found.")
    logger.info("SME deleted: %s", sme_id)
    return _ok({"deleted": sme_id})
