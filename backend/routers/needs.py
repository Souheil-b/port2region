"""Need CRUD endpoints.

Routes:
    POST   /api/needs           — create Need (triggers Claude tag extraction)
    GET    /api/needs           — list all Needs
    GET    /api/needs/{need_id} — get single Need
"""

import logging
from typing import Any, Dict

from fastapi import APIRouter

from models.need import Need, NeedCreate
from services import claude_service, storage_service
from services.notification_service import create_notification

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/needs", tags=["needs"])


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
async def create_need(payload: NeedCreate) -> Dict[str, Any]:
    """Create a new procurement Need and extract tags with Claude.

    Args:
        payload (NeedCreate): New need data.

    Returns:
        Dict[str, Any]: Created Need wrapped in success envelope.
    """
    try:
        tags, required_capacity = await claude_service.extract_need_tags(
            title=payload.title,
            raw_description=payload.raw_description,
        )
        need = Need(
            title=payload.title,
            raw_description=payload.raw_description,
            tags=tags,
            required_capacity=required_capacity,
            location_zone=payload.location_zone,
            deadline_days=payload.deadline_days,
            min_score=payload.min_score,
            published_by=payload.published_by,
        )
        storage_service.upsert("needs", need.model_dump(mode="json"))
        logger.info("Need created: %s (%s)", need.id, need.title)

        # Notify all PMEs + investors of new need
        create_notification(
            recipient_type="all_pmes",
            recipient_id=None,
            title="🆕 Nouveau besoin publié",
            message=f"{need.title} — {need.published_by}",
            notif_type="new_need",
            link=f"/needs/{need.id}",
        )
        create_notification(
            recipient_type="investisseur",
            recipient_id=None,
            title="🆕 Nouveau besoin au port",
            message=f"{need.title} — opportunité d'investissement potentielle",
            notif_type="new_need",
            link=f"/needs/{need.id}",
        )
        return _ok(need.model_dump(mode="json"))
    except Exception as exc:
        logger.error("Failed to create Need: %s", exc)
        return _err("Failed to create Need. Please try again.")


@router.get("", response_model=Dict[str, Any])
def list_needs() -> Dict[str, Any]:
    """Return all Needs in the data store.

    Returns:
        Dict[str, Any]: List of Needs wrapped in success envelope.
    """
    needs = storage_service.load_all("needs")
    return _ok(needs)


@router.get("/{need_id}", response_model=Dict[str, Any])
def get_need(need_id: str) -> Dict[str, Any]:
    """Return a single Need by ID.

    Args:
        need_id (str): Need identifier.

    Returns:
        Dict[str, Any]: Need record or error envelope.
    """
    need = storage_service.find_by_id("needs", need_id)
    if need is None:
        return _err(f"Need '{need_id}' not found.")
    return _ok(need)
