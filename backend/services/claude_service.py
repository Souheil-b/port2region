"""Claude API integration for semantic tag extraction and gap opportunity generation.

Uses model claude-haiku-4-5 as specified in CLAUDE.md.
API key is read from the ANTHROPIC_API_KEY environment variable.
"""

import json
import logging
import os
import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Tuple

import anthropic

from models.match import GapOpportunity

logger = logging.getLogger(__name__)

MODEL_ID = "claude-haiku-4-5-20251001"


def _strip_markdown_fences(text: str) -> str:
    """Remove markdown code fences that Claude sometimes wraps around JSON.

    Handles patterns like:
        ```json\\n{...}\\n```
        ```\\n{...}\\n```

    Args:
        text (str): Raw text from Claude response.

    Returns:
        str: Clean text ready for json.loads().
    """
    stripped = text.strip()
    # Remove opening fence (```json or ```)
    stripped = re.sub(r"^```(?:json)?\s*\n?", "", stripped)
    # Remove closing fence
    stripped = re.sub(r"\n?```\s*$", "", stripped)
    return stripped.strip()

# ---------------------------------------------------------------------------
# Client initialisation
# ---------------------------------------------------------------------------


def _get_client() -> anthropic.Anthropic:
    """Instantiate an Anthropic client from the environment.

    Returns:
        anthropic.Anthropic: Configured client.

    Raises:
        ValueError: When ANTHROPIC_API_KEY is not set.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable is not set.")
    return anthropic.Anthropic(api_key=api_key)


# ---------------------------------------------------------------------------
# SME tag extraction
# ---------------------------------------------------------------------------

SME_SYSTEM_PROMPT = """You are a business analyst specialising in Moroccan SMEs and port logistics.
Your task is to extract structured capability tags from a company description.

Rules:
- Tags must be lowercase snake_case (e.g. transport_conteneurs, maintenance_industrielle).
- Extract 3 to 8 tags that best describe the company's core capabilities.
- capacity_summary must be a single sentence describing the company's operational capacity.
- Respond ONLY with valid JSON — no prose, no markdown fences.

Response format:
{
  "tags": ["tag_one", "tag_two", "tag_three"],
  "capacity_summary": "One concise sentence describing capacity."
}"""


async def extract_sme_tags(
    name: str, city: str, sector: str, raw_description: str
) -> Tuple[List[str], str]:
    """Extract capability tags and capacity summary for an SME using Claude.

    Args:
        name (str): Company name.
        city (str): Company city.
        sector (str): Business sector.
        raw_description (str): Free-text description of the company.

    Returns:
        Tuple[List[str], str]: (tags list, capacity_summary string).
            Falls back to empty list + empty string on any error.
    """
    client = _get_client()
    user_message = (
        f"Company: {name}\n"
        f"City: {city}\n"
        f"Sector: {sector}\n"
        f"Description: {raw_description}"
    )
    try:
        response = client.messages.create(
            model=MODEL_ID,
            max_tokens=512,
            system=SME_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        raw_text = _strip_markdown_fences(response.content[0].text)
        parsed = json.loads(raw_text)
        tags = [str(t).lower().replace(" ", "_") for t in parsed.get("tags", [])]
        capacity_summary = str(parsed.get("capacity_summary", ""))
        logger.info("Extracted %d tags for SME '%s'.", len(tags), name)
        return tags, capacity_summary
    except (json.JSONDecodeError, KeyError, IndexError, anthropic.APIError) as exc:
        logger.error("Claude tag extraction failed for SME '%s': %s", name, exc)
        return [], ""


# ---------------------------------------------------------------------------
# Need tag extraction
# ---------------------------------------------------------------------------

NEED_SYSTEM_PROMPT = """You are a procurement specialist for port infrastructure projects in Morocco.
Your task is to extract structured requirement tags from a procurement need description.

Rules:
- Tags must be lowercase snake_case (e.g. transport_conteneurs, soudure_certifiee).
- Extract 3 to 7 tags that represent the core technical requirements.
- required_capacity must be a single sentence describing the minimum operational capacity required.
- Respond ONLY with valid JSON — no prose, no markdown fences.

Response format:
{
  "tags": ["tag_one", "tag_two", "tag_three"],
  "required_capacity": "One concise sentence describing minimum capacity."
}"""


async def extract_need_tags(
    title: str, raw_description: str
) -> Tuple[List[str], str]:
    """Extract requirement tags and required_capacity for a Need using Claude.

    Args:
        title (str): Need title.
        raw_description (str): Detailed description of the procurement need.

    Returns:
        Tuple[List[str], str]: (tags list, required_capacity string).
            Falls back to empty list + empty string on any error.
    """
    client = _get_client()
    user_message = f"Title: {title}\nDescription: {raw_description}"
    try:
        response = client.messages.create(
            model=MODEL_ID,
            max_tokens=512,
            system=NEED_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        raw_text = _strip_markdown_fences(response.content[0].text)
        parsed = json.loads(raw_text)
        tags = [str(t).lower().replace(" ", "_") for t in parsed.get("tags", [])]
        required_capacity = str(parsed.get("required_capacity", ""))
        logger.info("Extracted %d tags for Need '%s'.", len(tags), title)
        return tags, required_capacity
    except (json.JSONDecodeError, KeyError, IndexError, anthropic.APIError) as exc:
        logger.error("Claude tag extraction failed for Need '%s': %s", title, exc)
        return [], ""


# ---------------------------------------------------------------------------
# Gap opportunity generation
# ---------------------------------------------------------------------------

GAP_SYSTEM_PROMPT = """Vous êtes un conseiller en développement économique pour la région Orientale du Maroc.
Un besoin d'achat du port Nador West Med n'a aucun prestataire local qualifié.
Votre mission : générer une description concrète d'opportunité d'investissement, ENTIÈREMENT EN FRANÇAIS.

Règles :
- sector : label court en français (ex. "ingénierie_navale", "services_maritimes", "logistique_frigorifique").
- description : expliquer l'opportunité d'affaires en 2-3 phrases en français.
- estimated_potential : chiffrer concrètement le potentiel (ex. "5 à 10 M MAD de chiffre d'affaires annuel").
- target_region : recommandation géographique courte (ex. "Nador, Région Orientale, Maroc").
- Répondre UNIQUEMENT avec du JSON valide — sans prose, sans balises markdown.

Format de réponse :
{
  "sector": "label_secteur",
  "description": "Description de l'opportunité en 2-3 phrases.",
  "estimated_potential": "Estimation du chiffre d'affaires ou taille de marché.",
  "target_region": "Région d'implantation recommandée."
}"""


async def generate_gap_opportunity(need: Dict[str, Any]) -> GapOpportunity:
    """Generate an investor GapOpportunity for a Need with no qualifying SME.

    Args:
        need (Dict[str, Any]): Need record dict with id, title, raw_description, tags.

    Returns:
        GapOpportunity: Populated gap record.
            On Claude error, returns a minimal gap with fallback text.
    """
    client = _get_client()
    need_tags_str = ", ".join(need.get("tags", []))
    user_message = (
        f"Need title: {need.get('title', '')}\n"
        f"Description: {need.get('raw_description', '')}\n"
        f"Required tags: {need_tags_str}\n"
        f"Location zone: {need.get('location_zone', '')}"
    )
    fallback_gap = GapOpportunity(
        id=str(uuid.uuid4()),
        need_id=need["id"],
        title=f"Opportunité : {need.get('title', 'Besoin non identifié')}",
        sector="non_classifié",
        description="Aucun prestataire local qualifié n'existe pour ce besoin. Opportunité d'investissement identifiée dans la région Orientale.",
        estimated_potential="Potentiel de marché à évaluer selon les volumes du port Nador West Med.",
        target_region="Nador, Région Orientale, Maroc",
        generated_at=datetime.utcnow(),
    )
    try:
        response = client.messages.create(
            model=MODEL_ID,
            max_tokens=512,
            system=GAP_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        raw_text = _strip_markdown_fences(response.content[0].text)
        parsed = json.loads(raw_text)
        gap = GapOpportunity(
            id=str(uuid.uuid4()),
            need_id=need["id"],
            title=f"Opportunité : {need.get('title', '')}",
            sector=str(parsed.get("sector", "unclassified")),
            description=str(parsed.get("description", "")),
            estimated_potential=str(parsed.get("estimated_potential", "")),
            target_region=str(parsed.get("target_region", "Nador, Oriental Region")),
            generated_at=datetime.utcnow(),
        )
        logger.info("Gap opportunity generated for need '%s'.", need.get("id"))
        return gap
    except (json.JSONDecodeError, KeyError, IndexError, anthropic.APIError) as exc:
        logger.error("Claude gap generation failed for need '%s': %s", need.get("id"), exc)
        return fallback_gap
