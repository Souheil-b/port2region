"""Deterministic scoring engine for PORT2REGION IA.

Every point is traceable and computed without any LLM call.
Total possible score: 100 pts (sector 40 + capacity 25 + location 20 + reputation 15).
"""

import logging
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from models.match import GapOpportunity, MatchResult, ScoreBreakdown

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SCORE_WEIGHTS = {
    "sector": 40,
    "capacity": 25,
    "location": 20,
    "reputation": 15,
}

# Location scores reflect proximity to Nador West Med port.
# Any city not listed scores 0 (outside Oriental region).
LOCATION_SCORES: Dict[str, int] = {
    "nador": 20,
    "berkane": 16,
    "oujda": 16,
    "taourirt": 10,
    "autre_oriental": 10,
}

MIN_SCORE_DEFAULT = 60


# ---------------------------------------------------------------------------
# Component scorers
# ---------------------------------------------------------------------------


def compute_sector_score(sme_tags: List[str], need_tags: List[str]) -> Tuple[int, str]:
    """Compute sector score using Jaccard similarity on tag sets.

    Args:
        sme_tags (List[str]): Tags from the SME profile.
        need_tags (List[str]): Tags required by the Need.

    Returns:
        Tuple[int, str]: (score 0-40, human-readable explanation).
    """
    sme_set = {t.strip().lower() for t in sme_tags}
    need_set = {t.strip().lower() for t in need_tags}

    if not sme_set or not need_set:
        return 0, "0 tags available"

    intersection = sme_set & need_set
    union = sme_set | need_set
    jaccard = len(intersection) / len(union)
    score = round(jaccard * SCORE_WEIGHTS["sector"])
    matched_tags = ", ".join(sorted(intersection)) if intersection else "none"
    explanation = (
        f"{len(intersection)}/{len(need_set)} need tags matched "
        f"(Jaccard {jaccard:.2f}) → tags: [{matched_tags}]"
    )
    logger.debug("sector_score=%d  %s", score, explanation)
    return score, explanation


def compute_location_score(sme_city: str, need_location_zone: str) -> Tuple[int, str]:
    """Compute location score based on SME city proximity to Nador West Med.

    Cities mapped explicitly in LOCATION_SCORES earn the listed points.
    Any city not in the map scores 0 (considered outside the Oriental region).
    The need_location_zone is used to apply a zone-match bonus when the SME's
    city directly matches the required zone (awards max for that zone).

    Args:
        sme_city (str): City from the SME profile.
        need_location_zone (str): Location zone required by the Need.

    Returns:
        Tuple[int, str]: (score 0-20, human-readable explanation).
    """
    city_key = sme_city.strip().lower()
    zone_key = need_location_zone.strip().lower()

    # Direct zone match — reward with full location points
    if city_key == zone_key and city_key in LOCATION_SCORES:
        score = LOCATION_SCORES[city_key]
        return score, f"City '{sme_city}' matches zone '{need_location_zone}' exactly → {score} pts"

    # Nador variants (nador_west_med, nador_port, etc.)
    if city_key == "nador" and zone_key.startswith("nador"):
        score = LOCATION_SCORES["nador"]
        return score, f"City '{sme_city}' matches Nador zone '{need_location_zone}' → {score} pts"

    # Lookup by city regardless of zone
    score = LOCATION_SCORES.get(city_key, 0)
    if score > 0:
        explanation = f"City '{sme_city}' in Oriental region → {score} pts (zone: {need_location_zone})"
    else:
        explanation = f"City '{sme_city}' outside Oriental region → 0 pts"
    logger.debug("location_score=%d  %s", score, explanation)
    return score, explanation


def compute_reputation_score(reputation: float) -> Tuple[int, str]:
    """Compute reputation score from SME's 0-5 reputation rating.

    Formula: (reputation / 5.0) * 15, capped at 15.

    Args:
        reputation (float): SME reputation score on a 0-5 scale.

    Returns:
        Tuple[int, str]: (score 0-15, human-readable explanation).
    """
    clamped = max(0.0, min(5.0, reputation))
    score = min(SCORE_WEIGHTS["reputation"], round((clamped / 5.0) * SCORE_WEIGHTS["reputation"]))
    explanation = f"reputation {clamped}/5.0 → {score} pts"
    logger.debug("reputation_score=%d  %s", score, explanation)
    return score, explanation


def _extract_first_number(text: str) -> Optional[int]:
    """Extract the first integer found in a text string.

    Args:
        text (str): Input text, e.g. "Minimum 8 certified technicians".

    Returns:
        Optional[int]: First integer found, or None.
    """
    match = re.search(r"\d+", text)
    return int(match.group()) if match else None


def compute_capacity_score(
    capacity_summary: str, required_capacity: str
) -> Tuple[int, str]:
    """Compute capacity score by comparing declared vs required numeric capacity.

    Strategy:
    1. Extract first integer from each text (e.g. "8 trucks" → 8).
    2. If SME number >= required number → full score (25).
    3. If SME number < required number → proportional score.
    4. If either text is unparseable → partial credit (12) when both non-empty,
       else 0.

    Args:
        capacity_summary (str): SME's declared capacity statement.
        required_capacity (str): Need's required capacity statement.

    Returns:
        Tuple[int, str]: (score 0-25, human-readable explanation).
    """
    max_pts = SCORE_WEIGHTS["capacity"]

    if not capacity_summary or not required_capacity:
        return 0, "missing capacity data → 0 pts"

    sme_num = _extract_first_number(capacity_summary)
    need_num = _extract_first_number(required_capacity)

    if sme_num is None or need_num is None:
        # Both have text but we cannot compare numerically → partial credit
        score = max_pts // 2
        return score, f"capacity declared but non-comparable → {score} pts (partial)"

    if need_num == 0:
        return max_pts, "required capacity is 0 → full score"

    if sme_num >= need_num:
        return max_pts, f"declared {sme_num} >= required {need_num} → full {max_pts} pts"

    ratio = sme_num / need_num
    score = max(0, round(ratio * max_pts))
    explanation = f"declared {sme_num} < required {need_num} ({ratio:.0%}) → {score} pts"
    logger.debug("capacity_score=%d  %s", score, explanation)
    return score, explanation


# ---------------------------------------------------------------------------
# Match composer
# ---------------------------------------------------------------------------


def compute_match(sme: Dict[str, Any], need: Dict[str, Any]) -> MatchResult:
    """Compute a full MatchResult between one SME and one Need.

    Args:
        sme (Dict[str, Any]): SME record dict.
        need (Dict[str, Any]): Need record dict.

    Returns:
        MatchResult: Populated match with score breakdown and justification.
    """
    s_sector, e_sector = compute_sector_score(sme.get("tags", []), need.get("tags", []))
    s_location, e_location = compute_location_score(
        sme.get("city", ""), need.get("location_zone", "")
    )
    s_reputation, e_reputation = compute_reputation_score(sme.get("reputation_score", 0.0))
    s_capacity, e_capacity = compute_capacity_score(
        sme.get("capacity_summary", ""), need.get("required_capacity", "")
    )

    total = s_sector + s_capacity + s_location + s_reputation

    justification = (
        f"Sector: {e_sector} | "
        f"Location: {e_location} | "
        f"Reputation: {e_reputation} | "
        f"Capacity: {e_capacity} | "
        f"Total: {total}/100"
    )

    return MatchResult(
        sme_id=sme["id"],
        need_id=need["id"],
        total_score=total,
        score_breakdown=ScoreBreakdown(
            sector_score=s_sector,
            capacity_score=s_capacity,
            location_score=s_location,
            reputation_score=s_reputation,
        ),
        justification=justification,
        matched_at=datetime.utcnow(),
    )


def run_matching(
    smes: List[Dict[str, Any]],
    needs: List[Dict[str, Any]],
) -> Tuple[List[MatchResult], List[str]]:
    """Run the full matching loop: all SMEs × all Needs.

    For each need, computes scores for every SME, retains those that
    meet or exceed need.min_score, and flags needs with no qualifying
    SMEs as gaps.

    Args:
        smes (List[Dict[str, Any]]): All SME records.
        needs (List[Dict[str, Any]]): All Need records.

    Returns:
        Tuple[List[MatchResult], List[str]]:
            - Sorted list of qualifying MatchResult objects (highest score first).
            - List of need IDs for which no SME met the threshold (gap needs).
    """
    all_matches: List[MatchResult] = []
    gap_need_ids: List[str] = []

    for need in needs:
        min_score = need.get("min_score", MIN_SCORE_DEFAULT)
        qualifying: List[MatchResult] = []

        for sme in smes:
            result = compute_match(sme, need)
            if result.total_score >= min_score:
                qualifying.append(result)

        if qualifying:
            qualifying.sort(key=lambda r: r.total_score, reverse=True)
            all_matches.extend(qualifying)
            logger.info(
                "Need '%s' — %d qualifying match(es), top score %d.",
                need.get("id"),
                len(qualifying),
                qualifying[0].total_score,
            )
        else:
            gap_need_ids.append(need["id"])
            logger.info("Need '%s' — no qualifying SME (GAP).", need.get("id"))

    return all_matches, gap_need_ids
