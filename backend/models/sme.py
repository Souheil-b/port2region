"""Pydantic models for SME (Small and Medium Enterprise) resources."""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class SMECreate(BaseModel):
    """Payload for creating a new SME.

    Attributes:
        name: Official company name.
        city: City where the SME is headquartered.
        sector: Business sector (e.g. transport, maintenance, agroalim).
        raw_description: Free-text description used for AI tag extraction.
        region_id: Region identifier (default: oriental).
        port_id: Nearest port identifier (optional).
        rce: Registre de Commerce d'Entreprise identifier.
        ice: Identifiant Commun de l'Entreprise.
        is_available: Whether the SME is currently available for missions.
    """

    name: str
    city: str
    sector: str
    raw_description: str
    region_id: str = "oriental"
    port_id: Optional[str] = None
    rce: str = ""
    ice: str = ""
    is_available: bool = True


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
        region_id: Region identifier.
        port_id: Nearest port identifier.
        rce: Registre de Commerce d'Entreprise identifier.
        ice: Identifiant Commun de l'Entreprise.
        is_available: Whether the SME is currently available.
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
    region_id: str = "oriental"
    port_id: Optional[str] = None
    rce: str = ""
    ice: str = ""
    is_available: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SMEUpdate(BaseModel):
    """Partial update payload for an existing SME.

    All fields are optional — only provided fields are updated.

    Attributes:
        name: Official company name.
        city: City of headquarters.
        sector: Business sector.
        raw_description: Free-text description.
        tags: Capability tags list.
        capacity_summary: Capacity statement.
        region_id: Region identifier.
        port_id: Nearest port identifier.
        rce: Registre de Commerce d'Entreprise.
        ice: Identifiant Commun de l'Entreprise.
        is_available: Availability toggle.
    """

    name: Optional[str] = None
    city: Optional[str] = None
    sector: Optional[str] = None
    raw_description: Optional[str] = None
    tags: Optional[List[str]] = None
    capacity_summary: Optional[str] = None
    region_id: Optional[str] = None
    port_id: Optional[str] = None
    rce: Optional[str] = None
    ice: Optional[str] = None
    is_available: Optional[bool] = None
