"""Chatbot endpoint — contextual assistant for PORT2REGION IA."""
import logging
from typing import Any, Dict
from fastapi import APIRouter
from pydantic import BaseModel
from services import claude_service

router = APIRouter(tags=["chat"])
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Tu es l'assistant IA de PORT2REGION, une plateforme de mise en relation entre les PME de la région Orientale du Maroc et les besoins en prestataires du port Nador West Med.

Ton rôle :
- Aider les PMEs à comprendre comment postuler aux besoins du port
- Expliquer le système de score de matching (secteur, capacité, localisation, réputation)
- Informer les investisseurs sur les opportunités et les gaps du marché
- Guider les utilisateurs du port dans la publication de besoins et la gestion des candidatures
- Répondre aux questions sur la région Orientale, le port Nador West Med, la zone franche

Contexte plateforme :
- 3 rôles : PME (postule aux besoins), Port Nador Med (publie des besoins), Investisseur (analyse le marché)
- Score de matching IA sur 100 : secteur (30pts), capacité (30pts), localisation (20pts), réputation (20pts)
- PME freemium : parcourir les besoins | Premium : postuler + analyser sa compatibilité
- Le port peut lancer un matching IA sur tous les besoins et inviter des PMEs

Réponds toujours en français, de façon concise et utile. Si tu ne sais pas, dis-le honnêtement."""


class ChatMessage(BaseModel):
    message: str
    role: str = "user"  # "pme" | "port" | "investisseur" | "user"


def _ok(data: Any) -> Dict[str, Any]:
    return {"success": True, "data": data}

def _err(msg: str) -> Dict[str, Any]:
    return {"success": False, "error": msg}


@router.post("/api/chat", response_model=Dict[str, Any])
async def chat(body: ChatMessage) -> Dict[str, Any]:
    """Send a message to the PORT2REGION contextual assistant."""
    try:
        user_context = ""
        if body.role == "pme":
            user_context = "[L'utilisateur est une PME de la région Orientale]"
        elif body.role == "port":
            user_context = "[L'utilisateur représente le port Nador West Med]"
        elif body.role == "investisseur":
            user_context = "[L'utilisateur est un investisseur analysant les opportunités]"

        full_message = f"{user_context}\n\n{body.message}".strip() if user_context else body.message

        import anthropic
        client = anthropic.AsyncAnthropic(api_key=claude_service.api_key)
        response = await client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=512,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": full_message}],
        )
        reply = response.content[0].text
        return _ok({"reply": reply})
    except Exception as exc:
        logger.error("Chat error: %s", exc)
        return _err("Service temporairement indisponible. Réessayez dans un instant.")
