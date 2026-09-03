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
- **Be gentle to foodsharing.de**: the app never calls their servers at
  runtime. `scripts/fetch_upstream.py` is the only exception — at most once
  per day, and don't run it without reason (see IMPLEMENTATION_PLAN.md,
  "Data sourcing").
- **Privacy is a feature**: no external hosts at runtime, no trackers, no
  personal data beyond what docs/legal/datenschutz.md describes. Changes
  that touch data handling must update that document too.
- **German UI, English code.**
- License: AGPL-3.0-only. By contributing you agree to license your work
  under it.
