"""Integration tests for the FastAPI application.

Uses httpx AsyncClient with TestClient — no live server required.
No Claude API calls are made (claude_service is patched).
"""

import sys
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

# Allow imports from backend root
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


class TestHealth:
    """Tests for the /health endpoint."""

    def test_health_returns_ok(self) -> None:
        """Health endpoint responds 200 with status ok."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# SME endpoints
# ---------------------------------------------------------------------------


class TestSMEEndpoints:
    """Tests for /api/smes endpoints."""

    def test_list_smes_success(self) -> None:
        """GET /api/smes returns success envelope with a list."""
        response = client.get("/api/smes")
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)

    def test_get_nonexistent_sme(self) -> None:
        """GET /api/smes/{id} for unknown id returns error envelope."""
        response = client.get("/api/smes/does-not-exist")
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is False
        assert "not found" in body["error"].lower()

    def test_create_sme_missing_fields_returns_422(self) -> None:
        """POST /api/smes with missing required fields returns HTTP 422."""
        response = client.post("/api/smes", json={"name": "Incomplete SME"})
        assert response.status_code == 422

    @patch("routers.smes.claude_service.extract_sme_tags", new_callable=AsyncMock)
    def test_create_sme(self, mock_extract: AsyncMock) -> None:
        """POST /api/smes creates an SME and returns it."""
        mock_extract.return_value = (["tag_a", "tag_b"], "Test capacity summary.")
        payload = {
            "name": "Test Company",
            "city": "Nador",
            "sector": "transport",
            "raw_description": "A test transport company in Nador.",
        }
        response = client.post("/api/smes", json=payload)
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        sme = body["data"]
        assert sme["name"] == "Test Company"
        assert sme["tags"] == ["tag_a", "tag_b"]
        assert "id" in sme

    @patch("routers.smes.claude_service.extract_sme_tags", new_callable=AsyncMock)
    def test_create_then_get_sme(self, mock_extract: AsyncMock) -> None:
        """Created SME can be retrieved by id."""
        mock_extract.return_value = (["transport_conteneurs"], "6 trucks available.")
        payload = {
            "name": "Retrieve Test",
            "city": "Berkane",
            "sector": "transport",
            "raw_description": "Company for retrieval test.",
        }
        create_response = client.post("/api/smes", json=payload)
        sme_id = create_response.json()["data"]["id"]

        get_response = client.get(f"/api/smes/{sme_id}")
        assert get_response.status_code == 200
        assert get_response.json()["data"]["id"] == sme_id

    @patch("routers.smes.claude_service.extract_sme_tags", new_callable=AsyncMock)
    def test_delete_sme(self, mock_extract: AsyncMock) -> None:
        """DELETE /api/smes/{id} removes the SME."""
        mock_extract.return_value = ([], "")
        payload = {
            "name": "To Delete",
            "city": "Oujda",
            "sector": "it",
            "raw_description": "Temporary company.",
        }
        sme_id = client.post("/api/smes", json=payload).json()["data"]["id"]

        delete_response = client.delete(f"/api/smes/{sme_id}")
        assert delete_response.status_code == 200
        assert delete_response.json()["success"] is True

        get_response = client.get(f"/api/smes/{sme_id}")
        assert get_response.json()["success"] is False

    def test_delete_nonexistent_sme(self) -> None:
        """DELETE /api/smes/{id} for unknown id returns error envelope."""
        response = client.delete("/api/smes/ghost-id")
        assert response.status_code == 200
        assert response.json()["success"] is False


# ---------------------------------------------------------------------------
# Need endpoints
# ---------------------------------------------------------------------------


class TestNeedEndpoints:
    """Tests for /api/needs endpoints."""

    def test_list_needs_success(self) -> None:
        """GET /api/needs returns success envelope with a list."""
        response = client.get("/api/needs")
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)

    def test_get_nonexistent_need(self) -> None:
        """GET /api/needs/{id} for unknown id returns error envelope."""
        response = client.get("/api/needs/does-not-exist")
        assert response.status_code == 200
        assert response.json()["success"] is False

    @patch("routers.needs.claude_service.extract_need_tags", new_callable=AsyncMock)
    def test_create_need(self, mock_extract: AsyncMock) -> None:
        """POST /api/needs creates a Need and returns it."""
        mock_extract.return_value = (["tag_x", "tag_y"], "Minimum 5 trucks required.")
        payload = {
            "title": "Transport need",
            "raw_description": "We need transport services.",
            "location_zone": "nador",
            "deadline_days": 30,
            "min_score": 60,
            "published_by": "Test Port",
        }
        response = client.post("/api/needs", json=payload)
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        need = body["data"]
        assert need["title"] == "Transport need"
        assert need["tags"] == ["tag_x", "tag_y"]


# ---------------------------------------------------------------------------
# Admin / seed endpoints
# ---------------------------------------------------------------------------


class TestAdminEndpoints:
    """Tests for /api/admin/seed endpoint."""

    def test_seed_returns_success(self) -> None:
        """POST /api/admin/seed returns a success envelope."""
        response = client.post("/api/admin/seed")
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert isinstance(body["data"], dict)


# ---------------------------------------------------------------------------
# Match endpoints
# ---------------------------------------------------------------------------


class TestMatchEndpoints:
    """Tests for /api/matches and /api/matches/gaps endpoints."""

    def test_list_matches_success(self) -> None:
        """GET /api/matches returns success envelope with a list."""
        response = client.get("/api/matches")
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)

    def test_list_gaps_success(self) -> None:
        """GET /api/matches/gaps returns success envelope with a list."""
        response = client.get("/api/matches/gaps")
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)
