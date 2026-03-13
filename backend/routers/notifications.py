"""Notification endpoints.

Routes:
    GET  /api/notifications/pme/{sme_id}     — PME notifications
    GET  /api/notifications/investisseur     — Investor notifications
    POST /api/notifications/mark-read/{id}  — Mark as read
    POST /api/notifications/mark-all-read   — Mark all as read for a recipient
"""
from typing import Any, Dict
from fastapi import APIRouter
from services.notification_service import (
    get_notifications_for_pme,
    get_notifications_for_investisseur,
    mark_read,
    storage_service,
)

router = APIRouter(tags=["notifications"])


def _ok(data: Any) -> Dict[str, Any]:
    return {"success": True, "data": data}


@router.get("/api/notifications/pme/{sme_id}", response_model=Dict[str, Any])
def list_pme_notifications(sme_id: str) -> Dict[str, Any]:
    notifs = get_notifications_for_pme(sme_id)
    # Sort newest first
    notifs.sort(key=lambda n: n.get("created_at", ""), reverse=True)
    return _ok(notifs)


@router.get("/api/notifications/investisseur", response_model=Dict[str, Any])
def list_investor_notifications() -> Dict[str, Any]:
    notifs = get_notifications_for_investisseur()
    notifs.sort(key=lambda n: n.get("created_at", ""), reverse=True)
    return _ok(notifs)


@router.post("/api/notifications/mark-read/{notif_id}", response_model=Dict[str, Any])
def mark_notification_read(notif_id: str) -> Dict[str, Any]:
    mark_read(notif_id)
    return _ok({"marked": notif_id})


@router.post("/api/notifications/mark-all-read", response_model=Dict[str, Any])
def mark_all_read(body: Dict[str, Any]) -> Dict[str, Any]:
    """Mark all notifications as read for a given recipient."""
    sme_id = body.get("sme_id")
    recipient_type = body.get("recipient_type")
    notifs = storage_service.load_all("notifications")
    for n in notifs:
        if sme_id and n.get("recipient_id") == sme_id:
            n["read"] = True
        elif recipient_type and n.get("recipient_type") == recipient_type and not sme_id:
            n["read"] = True
    storage_service.save_all("notifications", notifs)
    return _ok({"marked_all": True})
