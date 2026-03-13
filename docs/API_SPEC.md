# API Specification — PORT2REGION IA

> Base URL: `http://localhost:8000`
> All responses follow: `{"success": true, "data": {...}}` or `{"success": false, "error": "message"}`

---

## Health

### GET /health

Returns server liveness status.

**Response:**
```json
{"status": "ok"}
```

---

## SMEs — `/api/smes`

### POST /api/smes

Register a new SME. Calls Claude to extract capability tags and capacity summary.

**Request body:**
```json
{
  "name": "TRANSORIENT SARL",
  "city": "Nador",
  "sector": "transport",
  "raw_description": "Transport frigorifique et logistique portuaire, flotte de 8 camions."
}
```

| Field           | Type   | Required | Description                     |
|-----------------|--------|----------|---------------------------------|
| name            | string | yes      | Company legal name              |
| city            | string | yes      | City (used for location scoring)|
| sector          | string | yes      | Primary sector label            |
| raw_description | string | yes      | Free-text description           |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "TRANSORIENT SARL",
    "city": "Nador",
    "sector": "transport",
    "raw_description": "...",
    "tags": ["transport_conteneurs", "logistique_portuaire"],
    "capacity_summary": "Flotte de 8 camions frigorifiques.",
    "reputation_score": 0.0,
    "missions_count": 0,
    "created_at": "2026-03-12T10:00:00"
  }
}
```

**Error (422):** Missing or invalid fields → Pydantic validation error.

---

### GET /api/smes

List all registered SMEs.

**Query params:** `?sector=transport` (optional filter)

**Response (200):**
```json
{
  "success": true,
  "data": [{ ...sme object... }, ...]
}
```

---

### GET /api/smes/{sme_id}

Retrieve a single SME by ID.

**Response (200 — found):**
```json
{"success": true, "data": { ...sme object... }}
```

**Response (200 — not found):**
```json
{"success": false, "error": "SME 'sme-xyz' not found."}
```

---

### DELETE /api/smes/{sme_id}

Delete an SME by ID.

**Response (200 — deleted):**
```json
{"success": true, "data": {"deleted": "sme-xyz"}}
```

**Response (200 — not found):**
```json
{"success": false, "error": "SME 'sme-xyz' not found."}
```

---

## Needs — `/api/needs`

### POST /api/needs

Publish a new procurement need. Calls Claude to extract requirement tags and required capacity.

**Request body:**
```json
{
  "title": "Transport conteneurs zone franche",
  "raw_description": "Besoin de transport de conteneurs vers la zone franche...",
  "location_zone": "nador",
  "deadline_days": 30,
  "min_score": 60,
  "published_by": "Nador West Med"
}
```

| Field           | Type    | Required | Default | Description                      |
|-----------------|---------|----------|---------|----------------------------------|
| title           | string  | yes      | —       | Short need title                 |
| raw_description | string  | yes      | —       | Detailed need description        |
| location_zone   | string  | yes      | —       | Required zone (e.g. `"nador"`)  |
| deadline_days   | integer | yes      | —       | Days until deadline              |
| min_score       | integer | no       | 60      | Minimum match score to qualify   |
| published_by    | string  | yes      | —       | Issuing organisation             |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Transport conteneurs zone franche",
    "raw_description": "...",
    "tags": ["transport_conteneurs", "zone_franche", "logistique_portuaire"],
    "required_capacity": "Minimum 3 container trucks with zone franche permit.",
    "location_zone": "nador",
    "deadline_days": 30,
    "min_score": 60,
    "published_by": "Nador West Med",
    "published_at": "2026-03-12T10:00:00",
    "status": "open"
  }
}
```

---

### GET /api/needs

List all needs.

**Query params:** `?status=open` (optional filter)

**Response (200):**
```json
{"success": true, "data": [{ ...need object... }, ...]}
```

---

### GET /api/needs/{need_id}

Retrieve a single need by ID.

**Response (200 — found):**
```json
{"success": true, "data": { ...need object... }}
```

**Response (200 — not found):**
```json
{"success": false, "error": "Need 'need-xyz' not found."}
```

---

## Matching — `/api/matches`

### POST /api/matches/run

Run the deterministic scoring engine for all Needs vs all SMEs.

- SMEs scoring >= `need.min_score` are saved as `MatchResult` records.
- Needs with no qualifying SME trigger Claude gap opportunity generation.

**Request body:** _(empty — matches all needs against all SMEs)_

**Response (200):**
```json
{
  "success": true,
  "data": {
    "matches_count": 12,
    "gaps_count": 2,
    "matches": [
      {
        "sme_id": "sme-003",
        "need_id": "need-001",
        "total_score": 96,
        "score_breakdown": {
          "sector_score": 30,
          "capacity_score": 25,
          "location_score": 20,
          "reputation_score": 11
        },
        "justification": "Sector: 3/3 need tags matched ... | Total: 96/100",
        "matched_at": "2026-03-12T10:05:00"
      }
    ],
    "gaps": [
      {
        "id": "uuid",
        "need_id": "need-004",
        "title": "Opportunity: Naval engineering / port piloting",
        "sector": "naval_engineering",
        "description": "No qualified local supplier exists...",
        "estimated_potential": "MAD 5-10M annual revenue",
        "target_region": "Nador, Oriental Region, Morocco",
        "generated_at": "2026-03-12T10:05:00"
      }
    ]
  }
}
```

---

### GET /api/matches

List all stored match results.

**Response (200):**
```json
{"success": true, "data": [{ ...match object... }, ...]}
```

---

### GET /api/matches/gaps

List all investor gap opportunities.

**Response (200):**
```json
{"success": true, "data": [{ ...gap object... }, ...]}
```

---

## Admin — `/api/admin`

### POST /api/admin/seed

Seed runtime data stores from mock seed files. Idempotent — only seeds empty collections.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "smes": 20,
    "needs": 5
  }
}
```

Returns `0` for collections that were already populated.

---

## Dashboard Stats

There is no dedicated `/api/dashboard` endpoint. The frontend computes stats by combining:

| Stat                    | Source                             |
|-------------------------|------------------------------------|
| Total SMEs              | `GET /api/smes` → count            |
| Total needs             | `GET /api/needs` → count           |
| Total matches           | `GET /api/matches` → count         |
| Average match score     | `GET /api/matches` → avg(total_score) |
| Sector distribution     | `GET /api/smes` → group by sector  |
| Gap opportunities       | `GET /api/matches/gaps` → count    |

---

## Data Models

### SME

| Field           | Type    | Description                        |
|-----------------|---------|------------------------------------|
| id              | string  | UUID                               |
| name            | string  | Company legal name                 |
| city            | string  | City (used for location scoring)   |
| sector          | string  | Primary sector label               |
| raw_description | string  | Original free-text description     |
| tags            | array   | Extracted capability tags          |
| capacity_summary| string  | One-sentence capacity description  |
| reputation_score| float   | 0.0–5.0 rating                     |
| missions_count  | integer | Number of completed missions       |
| created_at      | string  | ISO 8601 datetime                  |

### Need

| Field            | Type    | Description                          |
|------------------|---------|--------------------------------------|
| id               | string  | UUID                                 |
| title            | string  | Short need title                     |
| raw_description  | string  | Detailed description                 |
| tags             | array   | Extracted requirement tags           |
| required_capacity| string  | Minimum operational capacity         |
| location_zone    | string  | Required geographic zone             |
| deadline_days    | integer | Days until deadline                  |
| min_score        | integer | Minimum qualifying match score (60)  |
| published_by     | string  | Issuing organisation                 |
| published_at     | string  | ISO 8601 datetime                    |
| status           | string  | `open` / `matched` / `gap`           |

### MatchResult

| Field           | Type    | Description                          |
|-----------------|---------|--------------------------------------|
| sme_id          | string  | Matched SME ID                       |
| need_id         | string  | Matched Need ID                      |
| total_score     | integer | Combined score (0–100)               |
| score_breakdown | object  | sector/capacity/location/reputation  |
| justification   | string  | Human-readable score explanation     |
| matched_at      | string  | ISO 8601 datetime                    |

### GapOpportunity

| Field               | Type   | Description                          |
|---------------------|--------|--------------------------------------|
| id                  | string | UUID                                 |
| need_id             | string | Need that triggered this gap         |
| title               | string | Short opportunity title              |
| sector              | string | Target sector for new business       |
| description         | string | 2-3 sentence opportunity description |
| estimated_potential | string | Revenue/market estimate              |
| target_region       | string | Recommended operating region         |
| generated_at        | string | ISO 8601 datetime                    |
