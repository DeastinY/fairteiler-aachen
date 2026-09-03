"""Edge cases and abuse resistance."""

import datetime as dt

from app import crud
from app.status import derive_status

DEVICE = {"X-Device-Id": "harden-device"}


def test_tag_count_is_capped(client):
    resp = client.post(
        "/api/fairteiler/810/reports",
        json={"type": "brought", "tags": ["obst"] * 50},
        headers=DEVICE,
    )
    assert resp.status_code == 422


def test_duplicate_tags_are_deduplicated(client):
    resp = client.post(
        "/api/fairteiler/810/reports",
        json={"type": "brought", "tags": ["obst", "obst", "gemuese"]},
        headers=DEVICE,
    )
    assert resp.status_code == 201
    assert resp.json()["tags"] == ["obst", "gemuese"]


def test_device_header_length_limits(client):
    body = {"type": "brought", "tags": []}
    assert (
        client.post("/api/fairteiler/810/reports", json=body,
                    headers={"X-Device-Id": "abc"}).status_code == 422
    )
    assert (
        client.post("/api/fairteiler/810/reports", json=body,
                    headers={"X-Device-Id": "x" * 129}).status_code == 422
    )


def test_oversized_body_rejected(client):
    resp = client.post(
        "/api/fairteiler/810/reports",
        json={"type": "brought", "tags": [], "junk": "x" * 100_000},
        headers=DEVICE,
    )
    # unknown giant fields must not be stored; request either rejected or ignored
    assert resp.status_code in (201, 413, 422)
    detail = client.get("/api/fairteiler/810").json()
    assert "junk" not in str(detail["reports"])


def test_freshness_boundary_exactly_12_hours(db):
    now = dt.datetime.now(dt.timezone.utc)
    report = crud.create_report(
        db, fairteiler_id=810, type="brought", tags=[],
        device_hash="x", created_at=now - dt.timedelta(hours=12, seconds=1),
    )
    db.commit()
    assert derive_status([report], now)["state"] == "keine_meldung"
    fresh = crud.create_report(
        db, fairteiler_id=810, type="brought", tags=[],
        device_hash="x", created_at=now - dt.timedelta(hours=11, minutes=59),
    )
    db.commit()
    assert derive_status([fresh], now)["state"] == "etwas_da"


def test_unicode_survives_roundtrip(client):
    detail = client.get("/api/fairteiler/3465").json()  # „UNVERPACKT" with quotes
    assert "UNVERPACKT" in detail["name"]
    assert "„" in detail["name"]


def test_fairteiler_id_type_confusion(client):
    assert client.get("/api/fairteiler/abc").status_code == 422
    assert client.get("/api/fairteiler/-1").status_code in (404, 422)
    assert client.get("/api/fairteiler/999999999999999999999").status_code in (404, 422)
