# Scoring Engine Specification — PORT2REGION IA

> Deterministic, fully traceable scoring. Zero LLM calls. Every point is auditable.

---

## Formula Overview

```
Total Score = sector(40) + capacity(25) + location(20) + reputation(15) = 100 pts max
```

| Component  | Max pts | Method                                         |
|------------|---------|------------------------------------------------|
| Sector     | 40      | Jaccard similarity on SME tags vs need tags    |
| Capacity   | 25      | Declared capacity vs required capacity (numeric) |
| Location   | 20      | SME city proximity to Nador West Med port      |
| Reputation | 15      | (reputation_score / 5.0) × 15                 |

---

## 1. Sector Score (0–40)

Uses **Jaccard similarity** on the tag sets of the SME and the procurement need.

```
jaccard = |intersection(sme_tags, need_tags)| / |union(sme_tags, need_tags)|
sector_score = round(jaccard × 40)
```

**Examples:**

| sme_tags              | need_tags                   | intersection | union | Jaccard | Score |
|-----------------------|-----------------------------|-------------|-------|---------|-------|
| [A, B, C]             | [A, B, C]                   | 3           | 3     | 1.00    | 40    |
| [A, B, C, D]          | [A, B, C]                   | 3           | 4     | 0.75    | 30    |
| [A, B, E]             | [A, B, C, D, F]             | 2           | 6     | 0.33    | 13    |
| [X, Y]                | [A, B, C]                   | 0           | 5     | 0.00    | 0     |

- Tag comparison is **case-insensitive** (all lowercased before comparison).
- Empty tag sets on either side → score = 0.

---

## 2. Capacity Score (0–25)

Extracts the first integer from each text field using regex, then compares:

```
if sme_number >= need_number  →  full score = 25
if sme_number < need_number   →  proportional = round((sme_num / need_num) × 25)
if either text unparseable    →  partial credit = 12 (both fields non-empty)
if either field empty         →  score = 0
```

**Examples:**

| capacity_summary          | required_capacity          | Score |
|---------------------------|----------------------------|-------|
| "Fleet of 8 trucks"       | "Minimum 3 trucks"         | 25    |
| "Team of 4 technicians"   | "Minimum 8 technicians"    | 13    |
| "Available on demand"     | "Full-time on-site"        | 12    |
| ""                        | "3 units required"         | 0     |

---

## 3. Location Score (0–20)

Maps SME city to proximity points reflecting distance to **Nador West Med** port.

| SME City        | Score | Notes                             |
|-----------------|-------|-----------------------------------|
| Nador           | 20    | Port city — maximum proximity     |
| Berkane         | 16    | 40 km east of Nador               |
| Oujda           | 16    | Regional capital, good logistics  |
| Taourirt        | 10    | Oriental region interior          |
| autre_oriental  | 10    | Other Oriental region cities      |
| Any other city  | 0     | Outside Oriental region           |

**Zone matching rules:**
1. If `sme_city == need.location_zone` and city is in the map → awards that city's score.
2. If `sme_city == "nador"` and `need.location_zone` starts with `"nador"` → awards 20 pts.
3. Otherwise → looks up `sme_city` in the map regardless of zone.

---

## 4. Reputation Score (0–15)

Linear mapping from the SME's 0–5 rating:

```
reputation_score = min(15, round((reputation / 5.0) × 15))
```

| Reputation | Score |
|------------|-------|
| 0.0 (new)  | 0     |
| 2.5        | 8     |
| 3.5        | 11    |
| 4.0        | 12    |
| 4.5        | 14    |
| 5.0        | 15    |

Values above 5.0 are clamped to 15. Negative values are clamped to 0.

---

## 5. Gap Detection

A need is flagged as a **gap** when no SME in the database meets or exceeds the need's `min_score` (default: 60).

**Theoretical maximum for gap needs (no tag match):**

```
max_possible = location(20) + capacity(0 — no SME carries gap tags) + sector(0) + reputation(14 at rep=4.5)
             = 34  <  60  →  guaranteed gap
```

When a gap is detected:
1. The need's `status` is updated to `"gap"`.
2. Claude generates a structured `GapOpportunity` for the investor dashboard.
3. The gap is persisted to `backend/data/gaps.json`.

---

## 6. Justification Format

Every `MatchResult` includes a human-readable justification string:

```
Sector: <explanation> | Location: <explanation> | Reputation: <explanation> | Capacity: <explanation> | Total: <total>/100
```

**Example:**
```
Sector: 3/3 need tags matched (Jaccard 0.75) → tags: [logistique_portuaire, transport_conteneurs, zone_franche] |
Location: City 'Nador' matches zone 'nador' exactly → 20 pts |
Reputation: reputation 3.5/5.0 → 11 pts |
Capacity: declared 6 >= required 3 → full 25 pts |
Total: 96/100
```
