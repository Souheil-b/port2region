"""Pydantic models for procurement Need resources."""

import uuid
from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class NeedCreate(BaseModel):
    """Payload for creating a new procurement Need.

    Attributes:
        title: Short descriptive title.
        raw_description: Detailed free-text description for AI tag extraction.
        location_zone: Target zone — nador | berkane | oujda | oriental | national.
        deadline_days: Number of days until the need expires.
        min_score: Minimum matching score threshold (default 60).
        published_by: Organisation or contact publishing the need.
    """

    title: str
    raw_description: str
    location_zone: str
    deadline_days: int
    min_score: int = 60
    published_by: str


class Need(BaseModel):
    """Full Need entity stored in the data layer.

    Attributes:
        id: UUID string, auto-generated.
        title: Short descriptive title.
        raw_description: Original free-text description.
        tags: Normalised snake_case requirement tags extracted by Claude.
        required_capacity: One-sentence capacity requirement statement.
        location_zone: Target geographic zone.
        deadline_days: Days until expiry.
        min_score: Minimum matching threshold.
        published_by: Publishing organisation.
        published_at: ISO 8601 publication timestamp.
        status: Lifecycle status — open | matched | gap.
    """

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    raw_description: str
    tags: List[str] = []
    required_capacity: str = ""
    location_zone: str
    deadline_days: int
    min_score: int = 60
    published_by: str
    published_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "open"
