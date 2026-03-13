"""Unit tests for the deterministic scoring engine.

Tests cover every scoring component individually and the full match composer.
No LLM calls are made — all inputs are fixed.
"""

import sys
from pathlib import Path

import pytest

# Allow imports from backend root
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.scoring_service import (
    LOCATION_SCORES,
    SCORE_WEIGHTS,
    compute_capacity_score,
    compute_location_score,
    compute_match,
    compute_reputation_score,
    compute_sector_score,
    run_matching,
)


# ---------------------------------------------------------------------------
# compute_sector_score
# ---------------------------------------------------------------------------


class TestSectorScore:
    """Tests for Jaccard-based sector scoring."""

    def test_full_match_same_sets(self) -> None:
        """Identical tag sets yield full sector score."""
        tags = ["transport_conteneurs", "zone_franche", "logistique_portuaire"]
        score, _ = compute_sector_score(tags, tags)
        assert score == SCORE_WEIGHTS["sector"]

    def test_no_overlap(self) -> None:
        """Non-overlapping tag sets yield 0."""
        score, _ = compute_sector_score(["tag_a"], ["tag_b"])
        assert score == 0

    def test_partial_overlap(self) -> None:
        """Partial overlap yields proportional Jaccard score."""
        sme_tags = ["transport_conteneurs", "zone_franche", "camions_porteurs", "logistique_portuaire"]
        need_tags = ["transport_conteneurs", "zone_franche", "logistique_portuaire"]
        # intersection=3, union=4 → Jaccard=0.75 → 30 pts
        score, explanation = compute_sector_score(sme_tags, need_tags)
        assert score == 30
        assert "transport_conteneurs" in explanation

    def test_empty_sme_tags(self) -> None:
        """Empty SME tags yield 0."""
        score, _ = compute_sector_score([], ["tag_a"])
        assert score == 0

    def test_empty_need_tags(self) -> None:
        """Empty need tags yield 0."""
        score, _ = compute_sector_score(["tag_a"], [])
        assert score == 0

    def test_case_insensitive(self) -> None:
        """Tag comparison is case-insensitive."""
        score, _ = compute_sector_score(["Transport_Conteneurs"], ["transport_conteneurs"])
        assert score == SCORE_WEIGHTS["sector"]

    def test_score_capped_at_40(self) -> None:
        """Score never exceeds 40."""
        tags = [f"tag_{i}" for i in range(50)]
        score, _ = compute_sector_score(tags, tags)
        assert score <= SCORE_WEIGHTS["sector"]

    def test_partial_tags_two_of_five(self) -> None:
        """2 of 5 need tags matched yields sector_score between 10 and 20.

        sme_tags={t1,t2,t3}, need_tags={t1,t2,t4,t5,t6}
        intersection=2, union=6 → Jaccard=0.33 → round(13.3)=13 pts.
        """
        sme_tags = ["tag1", "tag2", "tag3"]
        need_tags = ["tag1", "tag2", "tag4", "tag5", "tag6"]
        score, _ = compute_sector_score(sme_tags, need_tags)
        assert 10 <= score <= 20


# ---------------------------------------------------------------------------
# compute_location_score
# ---------------------------------------------------------------------------


class TestLocationScore:
    """Tests for SME city proximity scoring."""

    def test_nador_scores_20(self) -> None:
        """Nador city yields maximum location score."""
        score, _ = compute_location_score("Nador", "nador")
        assert score == LOCATION_SCORES["nador"]

    def test_berkane_scores_16(self) -> None:
        """Berkane city yields 16 pts."""
        score, _ = compute_location_score("Berkane", "berkane")
        assert score == LOCATION_SCORES["berkane"]

    def test_oujda_scores_16(self) -> None:
        """Oujda city yields 16 pts."""
        score, _ = compute_location_score("Oujda", "oujda")
        assert score == LOCATION_SCORES["oujda"]

    def test_casablanca_scores_0(self) -> None:
        """Casablanca (outside Oriental) yields 0."""
        score, _ = compute_location_score("Casablanca", "nador")
        assert score == 0

    def test_nador_city_nador_west_med_zone(self) -> None:
        """Nador city matches nador_west_med zone and scores max."""
        score, _ = compute_location_score("Nador", "nador_west_med")
        assert score == LOCATION_SCORES["nador"]

    def test_case_insensitive_city(self) -> None:
        """City matching is case-insensitive."""
        score, _ = compute_location_score("NADOR", "nador")
        assert score == LOCATION_SCORES["nador"]


# ---------------------------------------------------------------------------
# compute_reputation_score
# ---------------------------------------------------------------------------


class TestReputationScore:
    """Tests for reputation scoring."""

    def test_max_reputation(self) -> None:
        """Reputation 5.0 yields full 15 pts."""
        score, _ = compute_reputation_score(5.0)
        assert score == SCORE_WEIGHTS["reputation"]

    def test_zero_reputation(self) -> None:
        """Reputation 0.0 yields 0 pts."""
        score, _ = compute_reputation_score(0.0)
        assert score == 0

    def test_mid_reputation(self) -> None:
        """Reputation 2.5 yields 7 or 8 pts (round-half)."""
        score, _ = compute_reputation_score(2.5)
        assert score in (7, 8)

    def test_above_5_clamped(self) -> None:
        """Reputation above 5.0 is clamped to 15 pts."""
        score, _ = compute_reputation_score(10.0)
        assert score == SCORE_WEIGHTS["reputation"]

    def test_negative_clamped(self) -> None:
        """Negative reputation is clamped to 0."""
        score, _ = compute_reputation_score(-1.0)
        assert score == 0


# ---------------------------------------------------------------------------
# compute_capacity_score
# ---------------------------------------------------------------------------


class TestCapacityScore:
    """Tests for capacity scoring."""

    def test_declared_exceeds_required(self) -> None:
        """SME capacity >= required yields full 25 pts."""
        score, _ = compute_capacity_score(
            "Fleet of 8 trucks (4 refrigerated, 4 flatbed)",
            "Minimum 3 container trucks",
        )
        assert score == SCORE_WEIGHTS["capacity"]

    def test_declared_equals_required(self) -> None:
        """SME capacity == required yields full 25 pts."""
        score, _ = compute_capacity_score("8 trucks available", "Minimum 8 trucks required")
        assert score == SCORE_WEIGHTS["capacity"]

    def test_declared_below_required(self) -> None:
        """SME capacity < required yields proportional score."""
        score, _ = compute_capacity_score(
            "Team of 4 technicians", "Minimum 8 certified technicians"
        )
        assert 0 < score < SCORE_WEIGHTS["capacity"]

    def test_no_capacity_data(self) -> None:
        """Missing capacity data yields 0."""
        score, _ = compute_capacity_score("", "")
        assert score == 0

    def test_no_numbers_partial_credit(self) -> None:
        """Non-comparable capacity text with both fields yields partial credit."""
        score, _ = compute_capacity_score("Available on demand", "Full-time on-site service required")
        assert score == SCORE_WEIGHTS["capacity"] // 2


# ---------------------------------------------------------------------------
# compute_match (full match)
# ---------------------------------------------------------------------------


class TestComputeMatch:
    """Integration tests for the full match composer."""

    def _make_sme(self, **kwargs):
        """Build a minimal SME dict for testing."""
        base = {
            "id": "sme-test",
            "name": "Test SME",
            "city": "Nador",
            "sector": "transport",
            "tags": ["transport_conteneurs", "zone_franche", "logistique_portuaire"],
            "capacity_summary": "Fleet of 6 container trucks, 5d/7 availability",
            "reputation_score": 3.5,
        }
        base.update(kwargs)
        return base

    def _make_need(self, **kwargs):
        """Build a minimal Need dict for testing."""
        base = {
            "id": "need-test",
            "title": "Container transport",
            "tags": ["transport_conteneurs", "zone_franche", "logistique_portuaire"],
            "required_capacity": "Minimum 3 container trucks, 5d/7 availability",
            "location_zone": "nador",
            "min_score": 60,
        }
        base.update(kwargs)
        return base

    def test_total_score_sums_components(self) -> None:
        """Total score equals sum of breakdown components."""
        sme = self._make_sme()
        need = self._make_need()
        result = compute_match(sme, need)
        bd = result.score_breakdown
        expected = bd.sector_score + bd.capacity_score + bd.location_score + bd.reputation_score
        assert result.total_score == expected

    def test_total_score_within_range(self) -> None:
        """Total score is always 0-100."""
        sme = self._make_sme()
        need = self._make_need()
        result = compute_match(sme, need)
        assert 0 <= result.total_score <= 100

    def test_justification_contains_total(self) -> None:
        """Justification string references the total score."""
        sme = self._make_sme()
        need = self._make_need()
        result = compute_match(sme, need)
        assert "Total:" in result.justification

    def test_nador_transport_scores_high(self) -> None:
        """Nador transport SME with matching tags scores well above 60."""
        sme = self._make_sme()
        need = self._make_need()
        result = compute_match(sme, need)
        assert result.total_score >= 60

    def test_casablanca_sme_outside_zone(self) -> None:
        """SME in Casablanca (outside Oriental) scores 0 for location."""
        sme = self._make_sme(city="Casablanca")
        need = self._make_need()
        result = compute_match(sme, need)
        assert result.score_breakdown.location_score == 0

    def test_perfect_match_high_score(self) -> None:
        """Same tags, Nador city, reputation 4.5 → total score >= 90."""
        sme = self._make_sme(
            tags=["transport_conteneurs", "zone_franche", "logistique_portuaire"],
            city="Nador",
            reputation_score=4.5,
            capacity_summary="Flotte de 10 camions disponibles",
        )
        need = self._make_need(
            tags=["transport_conteneurs", "zone_franche", "logistique_portuaire"],
            required_capacity="Minimum 3 camions",
            location_zone="nador",
        )
        result = compute_match(sme, need)
        assert result.total_score >= 90

    def test_justification_format(self) -> None:
        """Justification contains Sector, Capacity, Location, Reputation, Total labels."""
        sme = self._make_sme()
        need = self._make_need()
        result = compute_match(sme, need)
        justification_lower = result.justification.lower()
        assert "sector:" in justification_lower
        assert "capacity:" in justification_lower
        assert "location:" in justification_lower
        assert "reputation:" in justification_lower
        assert "total:" in justification_lower

    def test_score_bounds(self) -> None:
        """Total score is always between 0 and 100 inclusive."""
        worst_sme = self._make_sme(
            city="Casablanca",
            tags=[],
            reputation_score=0.0,
            capacity_summary="",
        )
        best_need = self._make_need(
            tags=["ingenierie_navale", "pilotage_portuaire"],
            required_capacity="Minimum 100 navires",
        )
        result = compute_match(worst_sme, best_need)
        assert 0 <= result.total_score <= 100


# ---------------------------------------------------------------------------
# run_matching
# ---------------------------------------------------------------------------


class TestRunMatching:
    """Tests for the full matching loop."""

    def _seed_smes(self):
        """Return a minimal SME list covering all scenarios."""
        return [
            {
                "id": "sme-001",
                "city": "Nador",
                "tags": ["transport_conteneurs", "zone_franche", "logistique_portuaire"],
                "capacity_summary": "Fleet of 6 trucks, 5d/7",
                "reputation_score": 3.5,
            },
            {
                "id": "sme-gap",
                "city": "Casablanca",
                "tags": ["autre_tag"],
                "capacity_summary": "Unrelated capacity",
                "reputation_score": 1.0,
            },
        ]

    def test_qualifying_sme_creates_match(self) -> None:
        """A well-matched SME produces at least one MatchResult."""
        smes = self._seed_smes()
        needs = [
            {
                "id": "need-001",
                "tags": ["transport_conteneurs", "zone_franche", "logistique_portuaire"],
                "required_capacity": "Minimum 3 trucks",
                "location_zone": "nador",
                "min_score": 60,
            }
        ]
        matches, gaps = run_matching(smes, needs)
        assert len(matches) >= 1
        assert "need-001" not in gaps

    def test_unmatched_need_goes_to_gaps(self) -> None:
        """A need with no qualifying SME is placed in the gap list."""
        smes = self._seed_smes()
        needs = [
            {
                "id": "need-gap",
                "tags": ["ingenierie_navale", "pilotage_portuaire", "construction_navale"],
                "required_capacity": "IMO certified naval engineers",
                "location_zone": "nador_west_med",
                "min_score": 60,
            }
        ]
        matches, gaps = run_matching(smes, needs)
        assert "need-gap" in gaps
        assert len(matches) == 0

    def test_matches_sorted_by_score_descending(self) -> None:
        """Matches for the same need are sorted highest score first."""
        smes = self._seed_smes() + [
            {
                "id": "sme-002",
                "city": "Nador",
                "tags": ["transport_conteneurs", "zone_franche", "logistique_portuaire"],
                "capacity_summary": "Fleet of 10 trucks",
                "reputation_score": 4.5,
            }
        ]
        needs = [
            {
                "id": "need-001",
                "tags": ["transport_conteneurs", "zone_franche", "logistique_portuaire"],
                "required_capacity": "Minimum 3 trucks",
                "location_zone": "nador",
                "min_score": 60,
            }
        ]
        matches, _ = run_matching(smes, needs)
        scores = [m.total_score for m in matches]
        assert scores == sorted(scores, reverse=True)
