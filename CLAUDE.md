# CLAUDE.md — PORT2REGION IA

> Conventions and standards for all agents working on this codebase.
> Derived from ialab-monitoring/CODING_STANDARDS.md — adapted for the PORT2REGION IA hackathon MVP.
> **All code and documentation must be in English.**

---

## ⚙️ Tooling

- **Backend:** Python (FastAPI + Pydantic v2 + uvicorn)
- **Frontend:** React 18 + Vite 5 + Tailwind CSS 3
- **AI:** Anthropic SDK (`anthropic` Python package), model `claude-haiku-4-5`
- **Tests:** pytest + pytest-asyncio + httpx
- **Linter/Formatter (backend):** black (line-length 100), isort (profile black), pylint (min 9.5/10)
- **Package manager (backend):** pip / requirements.txt (no poetry for MVP speed)

---

## 📁 File Structure

```
port2region/
├── CLAUDE.md
├── README.md
├── .env.example
├── .gitignore
├── backend/
│   ├── main.py
│   ├── routers/
│   ├── services/
│   ├── models/
│   ├── data/
│   │   └── seed/
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/
│   │   └── utils/
└── docs/
```

---

## 📝 Docstrings — Google Style, English, Always

Every module, class, method, and function must have a docstring.

```python
def process_something(param_a: str, param_b: int) -> bool:
    """One-line summary ending with a period.

    Args:
        param_a (str): What param_a represents.
        param_b (int): What param_b represents.

    Returns:
        bool: What True/False means.

    Raises:
        ValueError: When and why this is raised.
    """
```

---

## 🧹 Clean Code Rules

- **snake_case** for variables/functions; **UPPER_SNAKE_CASE** for constants
- Boolean vars: `is_`, `has_`, `should_` prefixes
- One function = one job; prefer early returns over deep nesting
- No magic values — use named constants
- **`logger` not `print()`** in all backend code
- Line length: 100 chars
- String quotes: double (black)

---

## 🔒 Security & Quality

- **No API keys hardcoded** — always read from `.env` via `python-dotenv`
- **All JSON reads/writes wrapped in try/except**
- **API errors must never expose stack traces to frontend**
- **Seed data must be idempotent** — restarting never duplicates data
- **React components must define PropTypes**
- **No `console.log` in production frontend code**

---

## 🗂️ API Response Format

All endpoints return:
```json
{"success": true, "data": {...}}
// or
{"success": false, "error": "human-readable message"}
```

---

## 📦 Git

- `.gitignore` covers: `__pycache__/`, `.env`, `node_modules/`, `dist/`, `.pytest_cache/`, `*.pyc`
- Commit messages: `type(scope): description` — e.g. `feat(backend): add scoring engine`
- **Never commit `.env`**

---

## 🚀 Running the Project

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm install
npm run dev
```
