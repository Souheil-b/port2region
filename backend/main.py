"""PORT2REGION IA — FastAPI application entry point.

Starts the API server with CORS enabled for local frontend development,
registers all routers, and auto-seeds mock data on first startup.
"""

import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import applications, matches, needs, smes
from services import storage_service

# Load environment variables from .env before anything else
load_dotenv()

# ---------------------------------------------------------------------------
# Logging configuration
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """FastAPI lifespan handler — seeds data on first startup.

    Args:
        app (FastAPI): The application instance.

    Yields:
        None: Yields control to the running application.
    """
    logger.info("PORT2REGION IA backend starting up…")
    seeded = storage_service.seed_from_mock_data()
    for collection, count in seeded.items():
        if count > 0:
            logger.info("Auto-seeded %d records into '%s'.", count, collection)
    yield
    logger.info("PORT2REGION IA backend shutting down.")


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="PORT2REGION IA",
    description="SME–port procurement matching API for the Oriental region of Morocco.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow local Vite dev server, Vercel and Render deployments
_default_origins = (
    "http://localhost:5173,"
    "http://localhost:3000,"
    "http://127.0.0.1:5173,"
    "https://port2region.vercel.app"
)
ALLOWED_ORIGINS = os.environ.get("CORS_ORIGINS", _default_origins).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(smes.router)
app.include_router(needs.router)
app.include_router(matches.router)
app.include_router(applications.router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/health", tags=["health"])
def health_check() -> dict:
    """Return a simple liveness response.

    Returns:
        dict: {"status": "ok"}.
    """
    return {"status": "ok"}
