# PORT2REGION IA — Agent Memory

## Project Status
- AGENT 0 (Dataset Builder): COMPLETE — seed data in backend/data/seed/
- AGENT 1 (Backend Builder): COMPLETE — full FastAPI backend implemented and tested
- AGENT 2 (Frontend Builder): COMPLETE — React 18 + Vite 5 + Tailwind CSS 3 frontend built
- AGENT 3 (QA & Docs): COMPLETE — 49 tests passing, docs/, README.md, VALIDATION_REPORT.md created

## Architecture
- Backend: FastAPI + Pydantic v2, Python 3.14, port 8000
- Data: JSON flat files in backend/data/ (smes.json, needs.json, matches.json, gaps.json)
- Seed: backend/data/seed/mock_smes.json (20 SMEs), mock_needs.json (5 needs)
- Model: claude-haiku-4-5-20251001 (CLAUDE.md specifies claude-haiku-4-5)

## Key Files
- backend/main.py — FastAPI app, auto-seeds on startup, CORS configured
- backend/services/scoring_service.py — deterministic engine (sector 40 + capacity 25 + location 20 + reputation 15 = 100)
- backend/services/claude_service.py — extract_sme_tags, extract_need_tags, generate_gap_opportunity
- backend/services/storage_service.py — JSON CRUD with threading.Lock

## Scoring Formula
- sector: Jaccard similarity × 40
- location: LOCATION_SCORES[sme.city.lower()] — nador=20, berkane/oujda=16, taourirt=10, other=0
- reputation: (score/5.0) × 15
- capacity: numeric comparison from text; full=25, proportional if under, partial=12 if non-numeric

## API Endpoints
- GET/POST /api/smes, GET /api/smes/{id}, DELETE /api/smes/{id}
- GET/POST /api/needs, GET /api/needs/{id}
- POST /api/matches/run — runs full matching + gap generation
- GET /api/matches, GET /api/matches/gaps
- POST /api/admin/seed — seeds from mock files (idempotent)
- GET /health

## Tests
- 49 tests total, all passing (35 scoring unit + 14 API integration)
- conftest.py: mock_claude_sme, mock_claude_need fixtures (return tuples, not dicts)
- Run: cd backend && python3 -m pytest tests/ -v

## Docs
- docs/SCORING_SPEC.md — scoring formula specification
- docs/API_SPEC.md — full API reference with all endpoints and shapes
- docs/DEMO_SCENARIO.md — 3-act demo script (TRANSMED OUJDA, matching, gap detection)
- README.md — project root professional README

## Conventions
- All responses: {"success": true, "data": ...} or {"success": false, "error": "..."}
- logger not print()
- No API keys hardcoded — ANTHROPIC_API_KEY from .env
