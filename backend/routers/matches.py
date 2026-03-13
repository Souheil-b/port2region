"""Matching and gap opportunity endpoints.

Routes:
    POST /api/matches/run  — run matching engine for all Needs vs all SMEs
    GET  /api/matches      — list stored match results
    GET  /api/matches/gaps — list stored gap opportunities
    POST /api/admin/seed   — seed runtime stores from mock data
"""

import logging
from typing import Any, Dict

from fastapi import APIRouter

from services import claude_service, scoring_service, storage_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["matches"])


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


@router.post("/api/matches/run", response_model=Dict[str, Any])
async def run_matching() -> Dict[str, Any]:
    """Run the scoring engine for all Needs against all SMEs.

    For each Need:
    - SMEs that score >= need.min_score are saved as MatchResult records.
    - Needs with no qualifying SME trigger a Claude gap opportunity.

    Updates the 'matches' and 'gaps' runtime stores.

    Returns:
        Dict[str, Any]: Summary with match count, gap count, and all results.
    """
    try:
        smes = storage_service.load_all("smes")
        needs = storage_service.load_all("needs")

        if not smes:
            return _err("No SMEs found. Seed data first via POST /api/admin/seed.")
        if not needs:
            return _err("No Needs found. Seed data first via POST /api/admin/seed.")

        matches, gap_need_ids = scoring_service.run_matching(smes, needs)

        # Persist match results
        match_dicts = [m.model_dump(mode="json") for m in matches]
        storage_service.replace_all("matches", match_dicts)

        # Generate and persist gap opportunities
        gap_dicts = []
        for need_id in gap_need_ids:
            need_record = storage_service.find_by_id("needs", need_id)
            if need_record:
                gap = await claude_service.generate_gap_opportunity(need_record)
                gap_dicts.append(gap.model_dump(mode="json"))

                # Update the need status to 'gap'
                need_record["status"] = "gap"
                storage_service.upsert("needs", need_record)

        # Update matched need statuses
        matched_need_ids = {m.need_id for m in matches}
        for need_id in matched_need_ids:
            need_record = storage_service.find_by_id("needs", need_id)
            if need_record and need_record.get("status") != "gap":
                need_record["status"] = "matched"
                storage_service.upsert("needs", need_record)

        storage_service.replace_all("gaps", gap_dicts)

        logger.info(
            "Matching complete: %d matches, %d gaps.", len(matches), len(gap_need_ids)
        )
        return _ok(
            {
                "matches_count": len(matches),
                "gaps_count": len(gap_need_ids),
                "matches": match_dicts,
                "gaps": gap_dicts,
            }
        )
    except Exception as exc:
        logger.error("Matching run failed: %s", exc)
        return _err("Matching failed. Check server logs for details.")


@router.get("/api/matches", response_model=Dict[str, Any])
def list_matches() -> Dict[str, Any]:
    """Return all stored match results.

    Returns:
        Dict[str, Any]: Match list wrapped in success envelope.
    """
    matches = storage_service.load_all("matches")
    return _ok(matches)


@router.post("/api/matches/run/{need_id}", response_model=Dict[str, Any])
async def run_matching_for_need(need_id: str) -> Dict[str, Any]:
    """Run the scoring engine for a single Need against all SMEs.

    Args:
        need_id (str): ID of the Need to match.

    Returns:
        Dict[str, Any]: Sorted match results + gap flag.
    """
    try:
        smes = storage_service.load_all("smes")
        need = storage_service.find_by_id("needs", need_id)

        if not need:
            return _err(f"Need '{need_id}' not found.")
        if not smes:
            return _err("Aucune PME trouvée. Vérifiez les données.")

        matches, gap_need_ids = scoring_service.run_matching(smes, [need])

        match_dicts = [m.model_dump(mode="json") for m in matches]

        # Persist new matches (merge with existing)
        existing = storage_service.load_all("matches")
        existing_ids = {(m["sme_id"], m["need_id"]) for m in existing}
        new_matches = [m for m in match_dicts if (m["sme_id"], m["need_id"]) not in existing_ids]
        storage_service.replace_all("matches", existing + new_matches)

        # Handle gap
        gap_data = None
        if gap_need_ids:
            gap = await claude_service.generate_gap_opportunity(need)
            gap_dict = gap.model_dump(mode="json")
            existing_gaps = storage_service.load_all("gaps")
            storage_service.replace_all("gaps", existing_gaps + [gap_dict])
            gap_data = gap_dict
            # Mark as gap only if not already decided by Port
            if need.get("status") == "open":
                need["status"] = "gap"
        # Note: "matched" status is set only when Port explicitly accepts an application
        # Running matching does NOT change status from "open" to "matched"

        storage_service.upsert("needs", need)

        # Compute scores for ALL SMEs (including those below min_score)
        all_results = []
        for sme in smes:
            result = scoring_service.compute_match(sme, need)
            all_results.append(result.model_dump(mode="json"))
        all_results.sort(key=lambda r: r["total_score"], reverse=True)

        return _ok({
            "need_id": need_id,
            "matches": match_dicts,
            "all_results": all_results,
            "gap": gap_data,
            "total_matches": len(match_dicts),
            "is_gap": bool(gap_need_ids),
        })
    except Exception as exc:
        logger.error("Matching failed for need %s: %s", need_id, exc)
        return _err("Erreur lors du matching. Veuillez réessayer.")


@router.get("/api/matches/gaps", response_model=Dict[str, Any])
def list_gaps() -> Dict[str, Any]:
    """Return all stored gap opportunities.

    Returns:
        Dict[str, Any]: Gap list wrapped in success envelope.
    """
    gaps = storage_service.load_all("gaps")
    return _ok(gaps)


@router.post("/api/admin/seed", response_model=Dict[str, Any])
def seed_data() -> Dict[str, Any]:
    """Seed runtime data stores from mock seed files.

    Idempotent: only seeds collections that are currently empty.

    Returns:
        Dict[str, Any]: Count of seeded records per collection.
    """
    try:
        result = storage_service.seed_from_mock_data()
        logger.info("Seed completed: %s", result)
        return _ok(result)
    except Exception as exc:
        logger.error("Seed failed: %s", exc)
        return _err("Seed operation failed.")
