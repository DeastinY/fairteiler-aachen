"""Dev entrypoint: `.venv/bin/python run.py` (or uvicorn run:app)."""

import os
import pathlib

from app.db import make_engine, make_session_factory
from app.main import create_app
from app.seed import load_seed

BASE = pathlib.Path(__file__).resolve().parent
DB_URL = os.environ.get("FAIRTEILER_DB", f"sqlite:///{BASE / 'fairteiler.db'}")

engine = make_engine(DB_URL)
session_factory = make_session_factory(engine)
with session_factory() as session:
    load_seed(session, BASE / "seed" / "fairteiler.json")
    session.commit()

app = create_app(engine=engine, session_factory=session_factory)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("PORT", "8000")))
