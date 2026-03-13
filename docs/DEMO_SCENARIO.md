# Demo Scenario — PORT2REGION IA

> A three-act walkthrough for the Ramadan IA Hackathon presentation.
> Duration: ~8 minutes total.

---

## Setup

Before starting, ensure:
1. Backend running: `cd backend && uvicorn main:app --reload --port 8000`
2. Frontend running: `cd frontend && npm run dev` → `http://localhost:5173`
3. Database seeded: `POST http://localhost:8000/api/admin/seed` (or auto-seeded on startup)

---

## Act 1 — SME Registration: "TRANSMED OUJDA"

**Narrative:** *"A transport company in Oujda wants to connect to the port ecosystem. Watch how AI extracts their capabilities in real time."*

### Steps

1. Navigate to `http://localhost:5173/register`
2. Fill in the form:

| Field            | Value                                                                                           |
|------------------|-------------------------------------------------------------------------------------------------|
| Company name     | TRANSMED OUJDA                                                                                  |
| City             | Oujda                                                                                           |
| Sector           | transport                                                                                       |
| Description      | Société de transport routier spécialisée en logistique portuaire et transit douanier. Flotte de 6 camions bâchés et 2 semi-remorques frigorifiques. Agréée transit douanier à la chambre de commerce d'Oujda. |

3. Click **Register SME**.
4. Claude extracts tags in ~2 seconds: `transport_routier`, `logistique_portuaire`, `transit_douanier`, `camions_baches`
5. SME profile appears with extracted tags and capacity summary.

### What to point out

- Zero manual tagging — Claude reads the description and generates structured tags.
- Tags are lowercase snake_case, ready for deterministic matching.
- Capacity summary extracted: *"Flotte de 6 camions et 2 semi-remorques frigorifiques."*

---

## Act 2 — Matching: need-001 "Container Transport"

**Narrative:** *"The port has a live need for container transport. Let's run the matching engine and see where TRANSMED OUJDA ranks."*

### Steps

1. Navigate to `http://localhost:5173/matching`
2. Click **Run Matching**.
3. The engine scores all 20 SMEs against all 5 needs in under 1 second.
4. Results for **need-001** appear sorted by score (highest first):

| Rank | SME                    | City   | Score | Key reason                              |
|------|------------------------|--------|-------|-----------------------------------------|
| 1    | NADOR LOGISTICS SARL   | Nador  | ~94   | Perfect tag match + Nador location bonus|
| 2    | TRANSORIENT SARL       | Nador  | ~83   | 2/3 tag match + Nador location bonus    |
| 3    | TRANSMED OUJDA         | Oujda  | ~77   | Good tags + Oujda location (16 pts)     |

5. Click on **TRANSMED OUJDA** to expand the score breakdown:
   - Sector: `30/40` — 3/4 tags matched
   - Location: `16/20` — Oujda in Oriental region
   - Reputation: `9/15` — new SME, building history
   - Capacity: `22/25` — 6 trucks declared vs 3 required

6. Click **Notify** to send the match notification.

### What to point out

- Every point is traceable — no black-box AI decisions.
- TRANSMED OUJDA scores 77/100 despite being in Oujda (not Nador), because the Oriental region proximity bonus rewards regional SMEs.
- The investor can see exactly why each SME ranked where it did.

---

## Act 3 — Gap Detection: need-004 "Naval Engineering"

**Narrative:** *"The port needs naval engineering expertise. Watch what happens when no SME in the region can satisfy this need."*

### Steps

1. Stay on `http://localhost:5173/matching`
2. Scroll down to the **Gaps Detected** section.
3. Show that **need-004** (ingenierie_navale, pilotage_portuaire, construction_navale) produced zero qualifying SMEs.
   - Best possible score among all 20 SMEs: 46/100 (location + reputation, zero tag match).
   - Threshold: 60. → **GAP CONFIRMED.**
4. Navigate to `http://localhost:5173/dashboard` (Investor Dashboard).
5. The gap card shows:

```
OPPORTUNITY: Naval Engineering / Port Piloting
Sector: naval_engineering
Market potential: MAD 5–10M annual revenue
Target region: Nador, Oriental Region, Morocco
Description: "Nador West Med port requires certified naval engineering and port piloting services.
No qualified supplier exists in the Oriental region. Investment in training and certification
infrastructure could unlock a multi-year service contract."
```

### What to point out

- The system doesn't just say "no match" — it generates an investment thesis.
- Claude analyzes the gap tags and generates a concrete market opportunity for investors.
- The dashboard aggregates all gaps into actionable cards for the Ministère de la Transition Numérique.

---

## Key Metrics Summary (to show on screen)

| Metric                     | Value (with seed data) |
|----------------------------|------------------------|
| Total SMEs registered      | 20                     |
| Total procurement needs    | 5                      |
| Needs with matches         | 3                      |
| Gap needs (no SME)         | 2                      |
| Highest match score        | ~94 (NADOR LOGISTICS)  |
| Sectors represented        | 6 (transport, maintenance, agroalim, IT, hospitality, BTP) |
