"""Test de matching : besoin mock vs PMEs existantes (seed).

Ce test vérifie qu'un besoin réaliste identifie correctement les bonnes PMEs
de la seed data, sans appel LLM.

Besoin mock : Transport frigorifique de produits de la mer — Nador West Med
→ doit matcher : TRANSORIENT SARL (sme-001)
→ doit aussi matcher partiellement : NADOR LOGISTICS SARL (sme-003)
→ ne doit PAS matcher : ingénierie navale, restauration, etc.
"""

import json
import sys
from pathlib import Path

import pytest

# Imports depuis la racine backend
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.scoring_service import compute_match, run_matching

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

SEED_DIR = Path(__file__).parent.parent / "data" / "seed"


@pytest.fixture(scope="module")
def seed_smes() -> list[dict]:
    """Charge les 20 PMEs de la seed réelle."""
    with open(SEED_DIR / "mock_smes.json", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def mock_need() -> dict:
    """
    Besoin mock : transport frigorifique de produits de la mer.
    Conçu pour matcher fort avec TRANSORIENT SARL (sme-001).
    """
    return {
        "id": "need-mock-frigo",
        "title": "Transport frigorifique — produits de la mer débarqués à Nador West Med",
        "raw_description": (
            "Le port Nador West Med recherche un prestataire de transport frigorifique "
            "pour acheminer les produits de la mer fraîchement débarqués vers les marchés "
            "régionaux et les unités de transformation. Minimum 3 camions frigorifiques, "
            "disponibilité 7j/7, certification ADR appréciée. Chauffeurs expérimentés "
            "dans les procédures portuaires. Démarrage sous 15 jours."
        ),
        "tags": ["transport_frigorifique", "logistique_portuaire", "transport_conteneurs"],
        "required_capacity": "Minimum 3 camions frigorifiques, disponibilité 7j/7, chauffeurs certifiés ADR",
        "location_zone": "nador",
        "deadline_days": 15,
        "min_score": 60,
        "published_by": "Nador West Med — Direction Commerciale",
        "published_at": "2025-03-20T10:00:00Z",
        "status": "open",
    }


# ---------------------------------------------------------------------------
# Tests individuels : besoin mock vs PME ciblée
# ---------------------------------------------------------------------------


class TestMockNeedVsTransorient:
    """TRANSORIENT SARL (sme-001) — candidat principal, score attendu ≥ 80."""

    def test_transorient_qualifies(self, seed_smes, mock_need):
        """TRANSORIENT dépasse le min_score de 60."""
        sme = next(s for s in seed_smes if s["id"] == "sme-001")
        result = compute_match(sme, mock_need)
        assert result.total_score >= mock_need["min_score"], (
            f"TRANSORIENT devrait qualifier (score={result.total_score})"
        )

    def test_transorient_scores_high(self, seed_smes, mock_need):
        """TRANSORIENT, Nador + tags frigorifique exact → score ≥ 80."""
        sme = next(s for s in seed_smes if s["id"] == "sme-001")
        result = compute_match(sme, mock_need)
        assert result.total_score >= 80, (
            f"Score attendu ≥ 80, obtenu {result.total_score}"
        )

    def test_transorient_sector_matches(self, seed_smes, mock_need):
        """Les tags frigorifique/portuaire génèrent un score secteur > 0."""
        sme = next(s for s in seed_smes if s["id"] == "sme-001")
        result = compute_match(sme, mock_need)
        assert result.score_breakdown.sector_score > 0

    def test_transorient_location_max(self, seed_smes, mock_need):
        """Nador → score localisation maximum (20 pts)."""
        sme = next(s for s in seed_smes if s["id"] == "sme-001")
        result = compute_match(sme, mock_need)
        assert result.score_breakdown.location_score == 20

    def test_transorient_capacity_full(self, seed_smes, mock_need):
        """8 camions dont 4 frigorifiques satisfait le besoin de 3 minimum."""
        sme = next(s for s in seed_smes if s["id"] == "sme-001")
        result = compute_match(sme, mock_need)
        assert result.score_breakdown.capacity_score == 25  # max capacity


class TestMockNeedVsNadorLogistics:
    """NADOR LOGISTICS SARL (sme-003) — match partiel, doit quand même qualifier."""

    def test_nador_logistics_qualifies(self, seed_smes, mock_need):
        """NADOR LOGISTICS a des tags proches (logistique_portuaire, conteneurs)."""
        sme = next(s for s in seed_smes if s["id"] == "sme-003")
        result = compute_match(sme, mock_need)
        # logistique_portuaire + transport_conteneurs matchent partiellement
        assert result.total_score >= mock_need["min_score"]

    def test_nador_logistics_scores_less_than_transorient(self, seed_smes, mock_need):
        """Pas de tag frigorifique → score inférieur à TRANSORIENT."""
        transorient = next(s for s in seed_smes if s["id"] == "sme-001")
        nador_log = next(s for s in seed_smes if s["id"] == "sme-003")
        score_transorient = compute_match(transorient, mock_need).total_score
        score_nador_log = compute_match(nador_log, mock_need).total_score
        assert score_transorient > score_nador_log


class TestMockNeedNoMatch:
    """PMEs hors-sujet ne doivent PAS qualifier ce besoin frigorifique."""

    @pytest.mark.parametrize("sme_id,sme_name", [
        ("sme-002", "TECHNIMAINT ORIENTAL — maintenance électromécanique"),
        ("sme-004", "ORIENTAL AGRO SERVICES — agroalimentaire Oujda"),
        ("sme-005", "NADOR MECANIQUE INDUSTRIELLE — mécanique lourde"),
    ])
    def test_off_topic_sme_does_not_qualify(self, seed_smes, mock_need, sme_id, sme_name):
        """PME hors-secteur transport frigorifique → score < min_score."""
        sme = next(s for s in seed_smes if s["id"] == sme_id)
        result = compute_match(sme, mock_need)
        assert result.total_score < mock_need["min_score"], (
            f"{sme_name} ne devrait pas qualifier (score={result.total_score})"
        )


# ---------------------------------------------------------------------------
# Test d'intégration : run_matching complet
# ---------------------------------------------------------------------------


class TestRunMatchingWithMockNeed:
    """run_matching sur l'ensemble de la seed → résultats attendus."""

    def test_at_least_one_match_found(self, seed_smes, mock_need):
        """Au moins une PME de la seed qualifie ce besoin."""
        matches, gaps = run_matching(seed_smes, [mock_need])
        assert len(matches) >= 1
        assert "need-mock-frigo" not in gaps

    def test_transorient_is_top_match(self, seed_smes, mock_need):
        """TRANSORIENT SARL est le meilleur match (premier résultat)."""
        matches, _ = run_matching(seed_smes, [mock_need])
        assert len(matches) >= 1
        top_match = matches[0]
        assert top_match.sme_id == "sme-001", (
            f"Top match attendu : sme-001, obtenu : {top_match.sme_id} "
            f"(score={top_match.total_score})"
        )

    def test_matches_sorted_descending(self, seed_smes, mock_need):
        """Les résultats sont triés du meilleur au moins bon."""
        matches, _ = run_matching(seed_smes, [mock_need])
        scores = [m.total_score for m in matches]
        assert scores == sorted(scores, reverse=True)

    def test_all_matches_above_min_score(self, seed_smes, mock_need):
        """Tous les matchs retournés dépassent le min_score."""
        matches, _ = run_matching(seed_smes, [mock_need])
        for m in matches:
            assert m.total_score >= mock_need["min_score"], (
                f"{m.sme_id} retourné avec score {m.total_score} < min_score"
            )

    def test_score_breakdown_present(self, seed_smes, mock_need):
        """Chaque match a un score_breakdown complet."""
        matches, _ = run_matching(seed_smes, [mock_need])
        for m in matches:
            bd = m.score_breakdown
            total = bd.sector_score + bd.capacity_score + bd.location_score + bd.reputation_score
            assert m.total_score == total
