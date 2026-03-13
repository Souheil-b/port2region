"""Application endpoints — PME applies to a Need, Port accepts/rejects.

Routes:
    POST /api/applications              — PME submits application for a Need
    GET  /api/applications              — list all applications (Port view)
    GET  /api/applications/my/{sme_id} — PME's own applications
    POST /api/applications/{id}/accept  — Port accepts application → notifies PME
    POST /api/applications/{id}/reject  — Port rejects application
"""

import logging
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from services import scoring_service, storage_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["applications"])


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


class ApplicationCreate(BaseModel):
    """Payload for submitting a new PME application.

    Attributes:
        sme_id (str): ID of the applying SME.
        need_id (str): ID of the targeted Need.
        message (Optional[str]): Optional cover message from the PME.
    """

    sme_id: str
    need_id: str
    message: Optional[str] = None


@router.post("/api/applications", response_model=Dict[str, Any])
async def create_application(payload: ApplicationCreate) -> Dict[str, Any]:
    """Submit a new PME application for a Need.

    Verifies that both the SME and Need exist, prevents duplicate applications,
    computes the matching score via the scoring engine, and persists the record.

    Args:
        payload (ApplicationCreate): sme_id, need_id, and optional message.

    Returns:
        Dict[str, Any]: Created application record wrapped in success envelope.
    """
    try:
        sme = storage_service.find_by_id("smes", payload.sme_id)
        if not sme:
            return _err(f"PME '{payload.sme_id}' introuvable.")

        need = storage_service.find_by_id("needs", payload.need_id)
        if not need:
            return _err(f"Besoin '{payload.need_id}' introuvable.")

        # Prevent duplicate application
        existing = storage_service.load_all("applications")
        for app in existing:
            if app.get("sme_id") == payload.sme_id and app.get("need_id") == payload.need_id:
                return _err("Candidature déjà soumise pour ce besoin.")

        # Compute matching score
        match_result = scoring_service.compute_match(sme, need)
        score = match_result.total_score

        application = {
            "id": str(uuid.uuid4()),
            "sme_id": payload.sme_id,
            "sme_name": sme.get("name", ""),
            "need_id": payload.need_id,
            "need_title": need.get("title", ""),
            "message": payload.message or "",
            "status": "pending",
            "score": score,
            "applied_at": datetime.utcnow().isoformat(),
            "decided_at": None,
            "decided_by": "",
        }

        storage_service.upsert("applications", application)
        logger.info(
            "New application: SME '%s' → Need '%s' (score: %d).",
            payload.sme_id,
            payload.need_id,
            score,
        )
        return _ok(application)
    except Exception as exc:
        logger.error("create_application failed: %s", exc)
        return _err("Erreur lors de la soumission de la candidature.")


@router.get("/api/applications", response_model=Dict[str, Any])
def list_applications(
    need_id: Optional[str] = None, status: Optional[str] = None
) -> Dict[str, Any]:
    """List all applications with optional filters.

    Args:
        need_id (Optional[str]): Filter by Need ID.
        status (Optional[str]): Filter by status (pending | accepted | rejected).

    Returns:
        Dict[str, Any]: Filtered application list wrapped in success envelope.
    """
    applications = storage_service.load_all("applications")
    if need_id:
        applications = [a for a in applications if a.get("need_id") == need_id]
    if status:
        applications = [a for a in applications if a.get("status") == status]
    return _ok(applications)


@router.get("/api/applications/my/{sme_id}", response_model=Dict[str, Any])
def list_my_applications(sme_id: str) -> Dict[str, Any]:
    """Return all applications submitted by a specific SME.

    Args:
        sme_id (str): ID of the SME.

    Returns:
        Dict[str, Any]: Application list for the given SME.
    """
    applications = storage_service.load_all("applications")
    my_apps = [a for a in applications if a.get("sme_id") == sme_id]
    return _ok(my_apps)


@router.post("/api/applications/{application_id}/accept", response_model=Dict[str, Any])
def accept_application(application_id: str) -> Dict[str, Any]:
    """Accept an application — sets status to accepted.

    Args:
        application_id (str): ID of the application to accept.

    Returns:
        Dict[str, Any]: Updated application record.
    """
    application = storage_service.find_by_id("applications", application_id)
    if not application:
        return _err(f"Candidature '{application_id}' introuvable.")

    application["status"] = "accepted"
    application["decided_at"] = datetime.utcnow().isoformat()
    application["decided_by"] = "port_user"
    storage_service.upsert("applications", application)

    # Update need status to "matched" when a PME is accepted
    need = storage_service.find_by_id("needs", application.get("need_id", ""))
    if need:
        need["status"] = "matched"
        storage_service.upsert("needs", need)

    logger.info("Application '%s' accepted — need '%s' marked as matched.", application_id, application.get("need_id"))
    return _ok(application)


@router.post("/api/applications/{application_id}/reject", response_model=Dict[str, Any])
def reject_application(application_id: str) -> Dict[str, Any]:
    """Reject an application — sets status to rejected.

    Args:
        application_id (str): ID of the application to reject.

    Returns:
        Dict[str, Any]: Updated application record.
    """
    application = storage_service.find_by_id("applications", application_id)
    if not application:
        return _err(f"Candidature '{application_id}' introuvable.")

    application["status"] = "rejected"
    application["decided_at"] = datetime.utcnow().isoformat()
    application["decided_by"] = "port_user"
    storage_service.upsert("applications", application)
    logger.info("Application '%s' rejected.", application_id)
    return _ok(application)
