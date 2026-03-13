# AGENT 2 HANDOFF — PORT2REGION Frontend

## Status: COMPLETE

React 18 + Vite 5 + Tailwind CSS 3 frontend fully built and production-build verified.

---

## How to Run

```bash
cd "/Users/souheil/side_projects/Ramadan IA/port2region/frontend"
npm install        # already done
npm run dev        # starts on http://localhost:5173
```

Backend must be running on port 8000. Vite proxies `/api` → `http://localhost:8000` automatically.

Optional: create `frontend/.env` with:
```
VITE_API_URL=http://localhost:8000
```

---

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | KPI cards + recent needs/SMEs + CTA buttons |
| `/register` | SMERegister | SME registration form (calls `POST /api/smes`) |
| `/needs/publish` | NeedPublish | Need publication form (calls `POST /api/needs`) |
| `/matching` | Matching | Run matching + view history with score breakdowns |
| `/dashboard` | InvestorDashboard | Recharts bar chart + gap cards + metrics |

---

## File Structure Created

```
frontend/
├── index.html                    — Inter font, FR lang
├── vite.config.js                — proxy /api → localhost:8000
├── tailwind.config.js            — extended colors + Inter font
├── postcss.config.js
├── package.json
└── src/
    ├── main.jsx                  — ReactDOM entry
    ├── App.jsx                   — BrowserRouter + Routes + Toaster
    ├── index.css                 — Tailwind directives
    ├── api/
    │   └── client.js             — smeApi, needsApi, matchingApi
    ├── pages/
    │   ├── Home.jsx              — hero + KPIs + recent content + CTAs
    │   ├── SMERegister.jsx       — registration form
    │   ├── NeedPublish.jsx       — need publish form
    │   ├── Matching.jsx          — run matching + history grouped by need
    │   └── InvestorDashboard.jsx — bar chart + MetricRow + GapCards
    ├── components/
    │   ├── Navbar.jsx            — NavLink with active state
    │   ├── TagBadge.jsx          — blue pill badge
    │   ├── SMECard.jsx           — SME card w/ sector/city/tags/reputation
    │   ├── NeedCard.jsx          — need card w/ status badge
    │   ├── GapCard.jsx           — gap opportunity card
    │   ├── ScoreCard.jsx         — big number KPI card
    │   └── ScoreBreakdown.jsx    — bar chart breakdown + expandable justification
    └── utils/
        └── formatters.js         — formatDate, scoreColor, SECTOR_LABELS, STATUS_CONFIG
```

---

## Design System

- Colors: primary `#1e3a5f`, accent `#2563eb`, teal `#0891b2`, amber `#d97706`, green `#16a34a`, red `#dc2626`
- Cards: `bg-card rounded-lg shadow-sm border border-border_custom`
- Transitions: `duration-150` only
- Font: Inter (Google Fonts)
- No gradients. All Tailwind utilities.

---

## API Integration Notes

- All API data accessed via `response.data.data` (backend wraps in `{"success": true, "data": ...}`)
- Dashboard stats computed frontend-side from `/api/smes` + `/api/needs` + `/api/matches` + `/api/matches/gaps`
- Matching run: `POST /api/matches/run` with `{"need_id": "..."}` in body
- Errors displayed via `react-hot-toast`

---

## Production Build

```bash
npm run build   # ✓ builds in ~800ms, outputs to dist/
```

No errors. One expected warning: recharts bundle >500kB (acceptable for MVP).

---

## For Agent 3 (Tests)

- Frontend tests: none written (MVP scope)
- Backend tests: `cd backend && python3 -m pytest tests/ -v` (44 tests, all passing per Agent 1)
- End-to-end: spin up backend + frontend and verify each page loads data correctly
