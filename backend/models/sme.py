"""Pydantic models for SME (Small and Medium Enterprise) resources."""

import uuid
from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class SMECreate(BaseModel):
    """Payload for creating a new SME.

    Attributes:
        name: Official company name.
        city: City where the SME is headquartered.
        sector: Business sector (e.g. transport, maintenance, agroalim).
        raw_description: Free-text description used for AI tag extraction.
    """

    name: str
    city: str
    sector: str
    raw_description: str


class SME(BaseModel):
    """Full SME entity stored in the data layer.

    Attributes:
        id: UUID string, auto-generated.
        name: Official company name.
        city: City of headquarters.
        sector: Business sector.
        raw_description: Original free-text description.
        tags: Normalised snake_case capability tags extracted by Claude.
        capacity_summary: One-sentence capacity statement.
        reputation_score: Float 0-5, derived from past mission ratings.
        missions_count: Total completed missions.
        created_at: ISO 8601 creation timestamp.
    """

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    city: str
    sector: str
    raw_description: str
    tags: List[str] = []
    capacity_summary: str = ""
    reputation_score: float = 0.0
    missions_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
