# PORT2REGION IA

**Intelligent matchmaking between Oriental SMEs and Port Nador Med**

> Ramadan IA Hackathon — Ministère de la Transition Numérique × Jazari Institute

---

## Overview

### The Problem

Nador West Med, Morocco's newest deep-water port, publishes procurement needs that local SMEs struggle to discover and respond to. At the same time, investors have no visibility into capability gaps in the Oriental region's business ecosystem.

### The Solution

PORT2REGION IA is an AI-assisted matchmaking platform that:

1. **Registers SMEs** — extracts structured capability tags from free-text descriptions using Claude.
2. **Publishes procurement needs** — extracts requirement tags from need descriptions.
3. **Matches SMEs to needs** — runs a fully deterministic, auditable scoring engine (no LLM in the critical path).
4. **Detects gaps** — when no SME meets a need, generates an investor opportunity report via Claude.

---

## Architecture — 4-Step Workflow

```
┌──────────────┐    Claude (tags)    ┌──────────────┐
│  SME Profile  │ ─────────────────► │  Tag Store   │
└──────────────┘                     └──────┬───────┘
                                            │
┌──────────────┐    Claude (tags)    ┌──────▼───────┐
│  Port Need   │ ─────────────────► │ Scoring Engine│ ──► MatchResult (0-100)
└──────────────┘                     └──────┬───────┘
                                            │ no match
                                     ┌──────▼───────┐
                                     │ Gap Generator │ ──► GapOpportunity (Claude)
                                     └──────────────┘
```

| Step | Actor       | Tool         | Output                                    |
|------|-------------|--------------|-------------------------------------------|
| 1    | SME         | Claude Haiku | Structured tags + capacity summary        |
| 2    | Port / NWM  | Claude Haiku | Requirement tags + required capacity      |
| 3    | System      | Scoring Engine | MatchResult with score 0-100            |
| 4    | System      | Claude Haiku | GapOpportunity for investor dashboard     |

---

## Scoring Engine

Every score is deterministic and fully traceable.

| Component  | Max | Formula                                               |
|------------|-----|-------------------------------------------------------|
| Sector     | 40  | Jaccard(sme_tags ∩ need_tags) / Jaccard(sme_tags ∪ need_tags) × 40 |
| Capacity   | 25  | declared_number / required_number × 25 (capped at 25)|
| Location   | 20  | Nador=20, Berkane/Oujda=16, Other Oriental=10, Outside=0 |
| Reputation | 15  | (reputation_score / 5.0) × 15                        |
| **TOTAL**  | **100** | |

See [docs/SCORING_SPEC.md](docs/SCORING_SPEC.md) for full specification.

---

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt

# Create environment file
cp ../.env.example .env
# Edit .env and set ANTHROPIC_API_KEY=your_key_here

uvicorn main:app --reload --port 8000
```

Backend starts on `http://localhost:8000`. Swagger UI at `http://localhost:8000/docs`.
Mock data (20 SMEs + 5 needs) is auto-seeded on first startup.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts on `http://localhost:5173`. Proxies `/api` to `http://localhost:8000`.

---

## API Reference

| Method | Endpoint              | Description                                      |
|--------|-----------------------|--------------------------------------------------|
| GET    | `/health`             | Liveness check                                   |
| POST   | `/api/smes`           | Register SME (calls Claude for tag extraction)   |
| GET    | `/api/smes`           | List all SMEs                                    |
| GET    | `/api/smes/{id}`      | Get single SME                                   |
| DELETE | `/api/smes/{id}`      | Delete SME                                       |
| POST   | `/api/needs`          | Publish need (calls Claude for tag extraction)   |
| GET    | `/api/needs`          | List all needs                                   |
| GET    | `/api/needs/{id}`     | Get single need                                  |
| POST   | `/api/matches/run`    | Run scoring engine for all needs × all SMEs      |
| GET    | `/api/matches`        | List stored match results                        |
| GET    | `/api/matches/gaps`   | List investor gap opportunities                  |
| POST   | `/api/admin/seed`     | Re-seed from mock data (idempotent)              |

See [docs/API_SPEC.md](docs/API_SPEC.md) for full payload and response shapes.

---

## Tech Stack

| Layer      | Technology                                   |
|------------|----------------------------------------------|
| Backend    | Python 3.11+, FastAPI, Pydantic v2, Uvicorn  |
| AI         | Anthropic SDK, `claude-haiku-4-5-20251001`   |
| Frontend   | React 18, Vite 5, Tailwind CSS 3, Recharts   |
| Storage    | JSON files (no database — MVP speed)         |
| Tests      | pytest, pytest-asyncio, httpx                |
| Linting    | black (100 chars), isort, pylint             |

---

## Project Structure

```
port2region/
├── CLAUDE.md                    — Coding standards for all agents
├── README.md
├── .env.example                 — Environment variable template
├── .gitignore
├── backend/
│   ├── main.py                  — FastAPI app, CORS, lifespan, router registration
│   ├── requirements.txt
│   ├── routers/
│   │   ├── smes.py              — /api/smes endpoints
│   │   ├── needs.py             — /api/needs endpoints
│   │   └── matches.py           — /api/matches + /api/admin/seed
│   ├── services/
│   │   ├── claude_service.py    — Claude API calls (3 prompts + fallback)
│   │   ├── scoring_service.py   — Deterministic scoring engine
│   │   └── storage_service.py   — JSON read/write + seed logic
│   ├── models/
│   │   ├── sme.py
│   │   ├── need.py
│   │   └── match.py
│   ├── data/
│   │   ├── smes.json            — Runtime SME store
│   │   ├── needs.json           — Runtime needs store
│   │   ├── matches.json         — Runtime match results
│   │   ├── gaps.json            — Runtime gap opportunities
│   │   └── seed/
│   │       ├── mock_smes.json   — 20 seeded SME profiles
│   │       └── mock_needs.json  — 5 seeded procurement needs
│   └── tests/
│       ├── conftest.py          — Shared pytest fixtures
│       ├── test_scoring.py      — Unit tests for scoring engine
│       └── test_api.py          — Integration tests for API endpoints
├── frontend/
│   ├── src/
│   │   ├── pages/               — Home, SMERegister, NeedPublish, Matching, InvestorDashboard
│   │   ├── components/          — Navbar, SMECard, NeedCard, GapCard, ScoreBreakdown, ...
│   │   ├── api/client.js        — API client (smeApi, needsApi, matchingApi)
│   │   └── utils/formatters.js  — Date, score color, sector labels
│   └── vite.config.js           — Proxy /api → localhost:8000
└── docs/
    ├── SCORING_SPEC.md          — Scoring formula specification
    ├── API_SPEC.md              — Full API reference
    └── DEMO_SCENARIO.md         — 3-act hackathon demo script
```

---

## Seed Data

The system ships with realistic mock data for demonstrations:

- **20 SMEs** across 6 sectors (transport, maintenance, agroalim, IT, hospitality, BTP)
- **Cities:** Nador (7), Oujda (7), Berkane (5), Casablanca (1 — intentional gap)
- **5 procurement needs:** 3 matchable (need-001 to need-003) + 2 gap needs (need-004, need-005)
- **Gap needs** require skills absent from all 20 SMEs: naval engineering, maritime consignment

---

## Hackathon Context

**Ramadan IA Hackathon**
Organised by the **Ministère de la Transition Numérique** in partnership with the **Jazari Institute**

**Challenge:** Build an AI-assisted tool that bridges the gap between Oriental region SMEs and the economic opportunities created by Nador West Med port.

**Approach:** Combine Claude's language understanding for unstructured text with a transparent, auditable scoring engine — so every match can be explained and trusted by decision-makers.
