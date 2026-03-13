"""Pytest configuration and shared fixtures for PORT2REGION IA backend tests.

Provides mock patches for Claude service calls and a pre-configured TestClient.
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

# Ensure backend root is importable
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import app  # noqa: E402


@pytest.fixture
def mock_claude_sme():
    """Patch extract_sme_tags to return a fixed (tags, capacity_summary) tuple.

    Returns:
        AsyncMock: The patched callable yielded inside the test.
    """
    with patch(
        "routers.smes.claude_service.extract_sme_tags",
        new_callable=AsyncMock,
        return_value=(
            ["transport_conteneurs", "logistique_portuaire"],
            "Flotte de 5 camions",
        ),
    ) as mock:
        yield mock


@pytest.fixture
def mock_claude_need():
    """Patch extract_need_tags to return a fixed (tags, required_capacity) tuple.

    Returns:
        AsyncMock: The patched callable yielded inside the test.
    """
    with patch(
        "routers.needs.claude_service.extract_need_tags",
        new_callable=AsyncMock,
        return_value=(
            ["transport_conteneurs", "zone_franche"],
            "3 camions minimum",
        ),
    ) as mock:
        yield mock


@pytest.fixture
def client():
    """Return a FastAPI TestClient for the main app.

    Returns:
        TestClient: Pre-configured test client (no live server).
    """
    return TestClient(app)
