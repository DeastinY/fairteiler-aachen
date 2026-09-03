import pathlib
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from app.db import make_engine, make_session_factory  # noqa: E402
from app.main import create_app  # noqa: E402
from app.seed import load_seed  # noqa: E402

SEED_PATH = pathlib.Path(__file__).resolve().parents[1] / "seed" / "fairteiler.json"


@pytest.fixture()
def engine():
    return make_engine("sqlite://")  # in-memory


@pytest.fixture()
def session_factory(engine):
    return make_session_factory(engine)


@pytest.fixture()
def app(engine, session_factory):
    application = create_app(engine=engine, session_factory=session_factory)
    with session_factory() as session:
        load_seed(session, SEED_PATH)
        session.commit()
    return application


@pytest.fixture()
def client(app):
    return TestClient(app)


@pytest.fixture()
def db(session_factory):
    with session_factory() as session:
        yield session
        session.commit()
