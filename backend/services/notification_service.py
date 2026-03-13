"""Notification service — create and retrieve notifications."""
import uuid
from datetime import datetime, timezone
from typing import Optional
from services import storage_service


def create_notification(
    recipient_type: str,          # "pme" | "investisseur" | "all_pmes"
    recipient_id: Optional[str],  # sme_id for pme, None for broadcast
    title: str,
    message: str,
    notif_type: str,              # "application_accepted" | "port_invitation" | "new_need" | "application_rejected"
    link: Optional[str] = None,
) -> dict:
    """Persist a notification and return the stored object."""
    notif = {
        "id": f"notif-{uuid.uuid4().hex[:10]}",
        "recipient_type": recipient_type,
        "recipient_id": recipient_id,
        "title": title,
        "message": message,
        "type": notif_type,
        "link": link,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    storage_service.upsert("notifications", notif)
    return notif


def get_notifications_for_pme(sme_id: str) -> list:
    """Return all notifications addressed to this PME."""
    all_notifs = storage_service.load_all("notifications")
    return [
        n for n in all_notifs
        if (n.get("recipient_type") == "pme" and n.get("recipient_id") == sme_id)
        or (n.get("recipient_type") == "all_pmes")
    ]


def get_notifications_for_investisseur() -> list:
    """Return all notifications for investors."""
    all_notifs = storage_service.load_all("notifications")
    return [n for n in all_notifs if n.get("recipient_type") == "investisseur"]


def mark_read(notif_id: str) -> bool:
    """Mark a single notification as read. Returns True if found."""
    notifs = storage_service.load_all("notifications")
    for n in notifs:
        if n.get("id") == notif_id:
            n["read"] = True
    storage_service.save_all("notifications", notifs)
    return True
