"""Pydantic models for matching results and gap opportunities."""

from datetime import datetime

from pydantic import BaseModel


class ScoreBreakdown(BaseModel):
    """Detailed breakdown of a match score by component.

    Attributes:
        sector_score: Points for tag similarity (0-40).
        capacity_score: Points for declared vs required capacity (0-25).
        location_score: Points for SME proximity to need zone (0-20).
        reputation_score: Points for SME reputation (0-15).
    """

    sector_score: int
    capacity_score: int
    location_score: int
    reputation_score: int


class MatchResult(BaseModel):
    """A scored match between an SME and a procurement Need.

    Attributes:
        sme_id: ID of the matched SME.
        need_id: ID of the matched Need.
        total_score: Sum of all component scores (0-100).
        score_breakdown: Per-component score detail.
        justification: Human-readable explanation of the match.
        matched_at: Timestamp when the match was computed.
    """

    sme_id: str
    need_id: str
    total_score: int
    score_breakdown: ScoreBreakdown
    justification: str
    matched_at: datetime


class GapOpportunity(BaseModel):
    """An investor opportunity generated when no SME can satisfy a Need.

    Attributes:
        id: UUID string.
        need_id: ID of the unsatisfied Need that triggered this gap.
        title: Short title of the opportunity.
        sector: Target sector for the new business.
        description: Detailed opportunity description.
        estimated_potential: Estimated market/revenue potential.
        target_region: Recommended operating region.
        generated_at: Timestamp when the opportunity was generated.
    """

    id: str
    need_id: str
    title: str
    sector: str
    description: str
    estimated_potential: str
    target_region: str
    generated_at: datetime
