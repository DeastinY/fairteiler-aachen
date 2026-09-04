# Contributing

Ein ehrenamtliches Community-Projekt — Hilfe ist willkommen (Code, Design,
Texte, Moderation, Fairteiler-Wissen). Issues und PRs gern auf Deutsch oder
Englisch.

## Setup

```bash
# Backend (Python ≥ 3.12)
cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest        # must stay green
.venv/bin/python run.py           # http://127.0.0.1:8000

# Frontend (Node ≥ 20)
cd frontend && npm install
npm run test                      # must stay green
npm run dev                       # http://localhost:5173, proxies /api
```

## Ground rules

- **Test-driven**: new behavior comes with tests; both suites green before
  every PR (CI enforces this).
- **Be gentle to foodsharing.de**: users' browsers never call their servers;
  only our backend does. Master data is synced at most once per day via
  `scripts/fetch_upstream.py` (don't run it without reason), and basket
  lookups go through a server-side cache (≤30 requests/day).
- **Privacy is a feature**: no trackers, no cookies, no third-party scripts;
  the only runtime external host is the map tile server. Changes that touch
  data handling must also update the in-app Datenschutzerklärung
  (`frontend/src/views/DatenschutzView.vue`).
- **German UI, English code.**
- License: AGPL-3.0-only. By contributing you agree to license your work
  under it.
