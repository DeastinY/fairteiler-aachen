import pathlib
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

import json  # noqa: E402

from app import push  # noqa: E402
from app.db import make_engine, make_session_factory  # noqa: E402
from app.main import create_app  # noqa: E402
from app.push import PushSettings  # noqa: E402
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
def push_app(engine, session_factory):
    settings = PushSettings(
        public_key="test-public-key",
        private_key="test-private-key",
        subject="mailto:test@example.org",
    )
    application = create_app(
        engine=engine, session_factory=session_factory, push_settings=settings
    )
    with session_factory() as session:
        load_seed(session, SEED_PATH)
        session.commit()
    return application


@pytest.fixture()
def push_client(push_app, sent):
    return TestClient(push_app)


@pytest.fixture()
def sent(monkeypatch):
    """Capture outgoing web pushes as (endpoint, payload dict) tuples."""
    captured = []

    def fake_sender(subscription_info, payload, settings):
        captured.append((subscription_info["endpoint"], json.loads(payload)))

    monkeypatch.setattr(push, "_send_webpush", fake_sender)
    return captured


@pytest.fixture()
def db(session_factory):
    with session_factory() as session:
        yield session
        session.commit()
