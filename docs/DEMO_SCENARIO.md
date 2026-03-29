# Demo Scenario — PORT2REGION IA

> A three-act walkthrough for the Ramadan IA Hackathon presentation.
> Duration: ~10 minutes total. Now covers 4 regions, 8 ports, 24 SMEs.

---

## Setup

Before starting, ensure:
1. Backend running: `cd backend && uvicorn main:app --reload --port 8000`
2. Frontend running: `cd frontend && npm run dev` → `http://localhost:5173`
3. Database seeded: auto-seeded on startup (or `POST http://localhost:8000/api/admin/seed`)

---

## Act 1 — SME Registration + Tag Validation

**Narrative:** *"A Casablanca logistics company wants to connect to the port ecosystem. Watch how AI extracts their capabilities and how the operator can review and correct the tags."*

### Steps

1. Navigate to `http://localhost:5173/role-select`
2. Select **Opérateur Portuaire National** → choose **Port de Casablanca** from the dropdown
3. Navigate to `http://localhost:5173/register`
4. Click the demo fill button **"CASA FREIGHT SOLUTIONS"**
5. Observe: Region = Casablanca-Settat, Port = Port de Casablanca, RCE/ICE pre-filled
6. Click **S'inscrire & Extraire les Tags**
7. Claude extracts tags in ~2 seconds → **TagConfirmStep** appears
8. Show the tag confirmation panel: remove one tag, add a custom tag
9. Click **Confirmer et enregistrer** → redirected to confirmation

### What to point out

- Zero manual tagging — Claude reads the description and generates structured tags.
- Tags are editable before saving — operators can correct AI mistakes.
- The same registration flow works for all 4 regions (Oriental, Casa-Settat, Tanger-Tétouan, Souss-Massa).
- Region → Port cascading dropdown ensures data integrity.

---

## Act 2 — National Need Publication + Matching

**Narrative:** *"A port authority publishes a national-scope transport need. The scoring engine rewards proximity but still surfaces qualified SMEs from other regions."*

### Steps

1. Navigate to `http://localhost:5173/needs/publish`
2. Click the guaranteed-match demo button **"Transport frigorifique ✓"**
3. Observe: Port = Nador West Med, Visibilité = **National** (purple "National" badge)
4. Click **Publier & Lancer le Matching**
5. TagConfirmStep appears — confirm tags as-is
6. Matching results appear, sorted by score:

| Rank | SME                         | Region       | Score | Key reason                           |
|------|-----------------------------|--------------|-------|--------------------------------------|
| 1    | NADOR LOGISTICS SARL        | Oriental     | ~94   | Perfect tag match + same region      |
| 2    | TRANSORIENT SARL            | Oriental     | ~83   | Good tags + Nador location bonus     |
| 3    | CASA FREIGHT SOLUTIONS      | Casa-Settat  | ~65   | Good tags + national need (adj. 10)  |

7. Click on **CASA FREIGHT SOLUTIONS** to expand the score breakdown:
   - Sector: `28/40` — tag overlap despite different region
   - Location: `10/20` — adjacent region, national need
   - Reputation: `9/15` — base reputation
   - Capacity: `18/25` — 8 trucks declared vs 3 required

### What to point out

- National needs moderate location scores but don't exclude distant SMEs.
- REGION_ADJACENCY map: Oriental ↔ Tanger-Tétouan ↔ Casablanca-Settat ↔ Souss-Massa.
- Every point is traceable — no black-box AI decisions.
- The "National" badge on NeedCard signals scope at a glance.

---

## Act 3 — Investor National View + Gap Detection

**Narrative:** *"The investor switches from national view to filter by region — the KPIs update in real time. Then we show a gap generating an investment opportunity."*

### Steps

1. Navigate to `http://localhost:5173/dashboard`
2. Show the national view header: **"Vue Nationale — toutes les régions"**, 24 PMEs, 8 besoins
3. Use the **RegionPortFilter** in the top-right to select **Oriental** → KPIs update:
   - PMEs drops to ~20 (only Oriental SMEs)
   - Subtitle: "Région Oriental"
4. Select **Port Nador West Med** from the port dropdown → further filters
5. Toggle back to national view
6. Activate **Premium** (toggle in navbar) → gap opportunities unlock
7. Show gap card: naval engineering / port piloting gap at Nador West Med:

```
OPPORTUNITY: Naval Engineering / Port Piloting
Sector: naval_engineering
Market potential: MAD 5–10M annual revenue
Target: Oriental Region — no qualified SME exists
```

8. Navigate to `/dashboard/market` to show the market intelligence view

### What to point out

- Real-time filtering with no extra API calls — useMemo over preloaded data.
- Investors can scope analysis to a specific port or zoom out nationally.
- Gap cards generate actionable investment theses from unmet procurement needs.
- Premium lock/unlock demonstrates the freemium → premium upgrade path.

---

## Act 4 — SME Dashboard: Edit Profile + Availability

**Narrative:** *"A PME operator updates their profile mid-session — availability status changes instantly."*

### Steps

1. Navigate to `http://localhost:5173/pme-auth`
2. Log in with an existing PME (demo fill: NADOR LOGISTICS SARL)
3. On the SME Dashboard: observe the green "Disponible" badge in the header
4. Click **Modifier mon profil** → EditProfileModal opens
5. Toggle availability off → save
6. Dashboard header now shows gray "Indisponible" badge
7. Navigate to `/smes` — SMECard for this company shows the gray dot

### What to point out

- Availability status is visible on every SMECard in the list view.
- Edit is in-place, no page reload needed.
- localStorage sync ensures the badge updates without a full re-auth.

---

## Key Metrics Summary (with 24-SME seed data)

| Metric                     | Value                                               |
|----------------------------|-----------------------------------------------------|
| Total SMEs registered      | 24 (20 Oriental + 2 Casa + 1 Tanger + 1 Agadir)    |
| Total procurement needs    | 8 (5 Oriental + 1 Casa + 1 Tanger + 1 national)    |
| Regions covered            | 4 (Oriental, Casablanca-Settat, Tanger-Tétouan, Souss-Massa) |
| Ports covered              | 8                                                   |
| Highest match score        | ~94 (NADOR LOGISTICS vs need-001)                   |
| Sectors represented        | 6 (transport, maintenance, agroalim, IT, hospitality, BTP) |
