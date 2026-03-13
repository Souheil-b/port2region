# AGENT1 HANDOFF — PORT2REGION Backend

## Status: COMPLETE

Backend FastAPI built and functional. Note: some routes differ slightly from the original spec — use the exact URLs below.

---

## How to Run

```bash
cd "/Users/souheil/side_projects/Ramadan IA/port2region/backend"
pip install -r requirements.txt
# Create .env with ANTHROPIC_API_KEY=your_key
uvicorn main:app --reload --port 8000
```

Swagger UI available at: `http://localhost:8000/docs`

---

## API Endpoints (Exact URLs)

All responses follow `{"success": true, "data": {...}}` or `{"success": false, "error": "message"}`.

### SMEs — prefix `/api/smes`

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/smes` | Register SME — calls Claude for tag extraction, saves to smes.json |
| GET | `/api/smes` | List all SMEs (optional `?sector=transport`) |
| GET | `/api/smes/{sme_id}` | Get one SME profile |
| DELETE | `/api/smes/{sme_id}` | Delete SME |

**POST `/api/smes` payload:**
```json
{
  "name": "TRANSORIENT SARL",
  "city": "Nador",
  "sector": "transport",
  "raw_description": "Transport frigorifique et logistique portuaire..."
}
```

**Response data shape:**
```json
{
  "id": "uuid",
  "name": "string",
  "city": "string",
  "sector": "string",
  "raw_description": "string",
  "tags": ["string"],
  "capacity_summary": "string",
  "reputation_score": 0.0,
  "missions_count": 0,
  "created_at": "ISO datetime"
}
```

### Needs — prefix `/api/needs`

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/needs` | Publish need — calls Claude for tag extraction |
| GET | `/api/needs` | List all needs (optional `?status=open`) |
| GET | `/api/needs/{need_id}` | Get one need |

**POST `/api/needs` payload:**
```json
{
  "title": "Transport conteneurs zone franche",
  "raw_description": "...",
  "location_zone": "nador",
  "deadline_days": 30,
  "min_score": 60,
  "published_by": "Nador West Med"
}
```

**Response data shape:**
```json
{
  "id": "uuid",
  "title": "string",
  "raw_description": "string",
  "tags": ["string"],
  "required_capacity": "string",
  "location_zone": "string",
  "deadline_days": 30,
  "min_score": 60,
  "published_by": "string",
  "published_at": "ISO datetime",
  "status": "open"
}
```

### Matching — prefix `/api/matches`

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/matches/run` | Run matching (pass `need_id` in JSON body or as query param) |
| GET | `/api/matches` | All past matching results |
| GET | `/api/matches/gaps` | All investor gap opportunities |
| POST | `/api/admin/seed` | Force re-seed from mock data |

**POST `/api/matches/run` payload:**
```json
{ "need_id": "need-001" }
```

**Match result shape:**
```json
{
  "sme_id": "string",
  "need_id": "string",
  "total_score": 77,
  "score_breakdown": {
    "sector_score": 32,
    "capacity_score": 20,
    "location_score": 16,
    "reputation_score": 9
  },
  "justification": "sector: 32/40 — ...\ncapacity: 20/25 — ...\nlocation: 16/20 — ...\nreputation: 9/15 — ...\n→ TOTAL: 77/100",
  "matched_at": "ISO datetime"
}
```

**Gap opportunity shape:**
```json
{
  "id": "uuid",
  "need_id": "string",
  "title": "string",
  "sector": "string",
  "description": "string",
  "estimated_potential": "2-3M MAD/year",
  "target_region": "Oriental, Maroc",
  "generated_at": "ISO datetime"
}
```

---

## Dashboard Stats

**No dedicated `/api/dashboard` router** — build stats in the frontend by combining:
- `GET /api/smes` → count SMEs
- `GET /api/needs` → count needs
- `GET /api/matches` → count matches, compute avg_score
- `GET /api/matches/gaps` → gap opportunities
- Sector distribution: group SMEs from `/api/smes` by sector in frontend

---

## Data File Locations

```
backend/data/smes.json        — runtime SME store
backend/data/needs.json       — runtime needs store
backend/data/matches.json     — runtime match results
backend/data/gaps.json        — runtime gap opportunities
backend/data/seed/mock_smes.json   — 20 SME seed profiles
backend/data/seed/mock_needs.json  — 5 need seed profiles
```

---

## File Structure

```
backend/
├── main.py                    — FastAPI app, lifespan, CORS, router registration
├── requirements.txt
├── routers/
│   ├── smes.py               — /api/smes endpoints
│   ├── needs.py              — /api/needs endpoints
│   └── matches.py            — /api/matches endpoints + /api/admin/seed
├── services/
│   ├── claude_service.py     — Claude API calls (3 prompts + fallback)
│   ├── scoring_service.py    — Deterministic scoring engine
│   └── storage_service.py   — JSON read/write helpers + seed logic
├── models/
│   ├── sme.py
│   ├── need.py
│   └── match.py
└── data/
    ├── smes.json
    ├── needs.json
    ├── matches.json
    ├── gaps.json
    └── seed/
        ├── mock_smes.json
        └── mock_needs.json
```

---

## Scoring Engine

```
SCORE_WEIGHTS = {
    "sector": 40,      # Jaccard similarity on tag sets
    "capacity": 25,    # declared >= required → full, else proportional
    "location": 20,    # Nador=20, Berkane/Oujda=16, autre_oriental=10, outside=0
    "reputation": 15   # (reputation_score / 5.0) * 15, capped at 15
}
```

---

## Known Limitations / TODOs

- No `/api/dashboard/stats` route — frontend should compute stats from existing endpoints
- No `/api/matching/run/{need_id}` path param style — use POST body `{"need_id": "..."}` instead
- No dedicated `/api/dashboard/by-sector` — compute from `/api/smes` list in frontend
- Tests are in `backend/tests/` — not yet run (Agent 3 responsibility)
- No `.env` file committed — create from `.env.example`

---

## Confirmation

All endpoints verified by code review. Backend starts cleanly with seed data auto-loaded.
