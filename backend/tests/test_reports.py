"""Crowd reports: creation, status derivation, activity, rate limiting."""

import datetime as dt

from app import crud

DEVICE_A = {"X-Device-Id": "device-aaaa"}
DEVICE_B = {"X-Device-Id": "device-bbbb"}


def post_report(client, fairteiler_id, body, headers=DEVICE_A):
    return client.post(f"/api/fairteiler/{fairteiler_id}/reports", json=body, headers=headers)


def test_brought_report_sets_status(client):
    resp = post_report(client, 810, {"type": "brought", "tags": ["brot_backwaren", "gemuese"]})
    assert resp.status_code == 201
    created = resp.json()
    assert created["type"] == "brought"
    assert created["tags"] == ["brot_backwaren", "gemuese"]
    assert "createdAt" in created
    assert "deviceId" not in created and "deviceHash" not in created

    point = next(p for p in client.get("/api/fairteiler").json() if p["id"] == 810)
    assert point["status"]["state"] == "etwas_da"
    assert point["status"]["tags"] == ["brot_backwaren", "gemuese"]
    assert point["status"]["lastReportAt"] is not None
    assert point["activity7d"][-1] == 1  # today

    detail = client.get("/api/fairteiler/810").json()
    assert len(detail["reports"]) == 1
    assert detail["reports"][0]["type"] == "brought"


def test_empty_report_overrides_brought(client):
    post_report(client, 810, {"type": "brought", "tags": ["obst"]}, DEVICE_A)
    resp = post_report(client, 810, {"type": "empty", "tags": []}, DEVICE_B)
    assert resp.status_code == 201
    point = next(p for p in client.get("/api/fairteiler").json() if p["id"] == 810)
    assert point["status"]["state"] == "leer"
    assert point["status"]["tags"] == []


def test_taken_report_keeps_stocked_status(client):
    post_report(client, 810, {"type": "brought", "tags": ["obst"]}, DEVICE_A)
    resp = post_report(client, 810, {"type": "taken", "tags": []}, DEVICE_B)
    assert resp.status_code == 201
    point = next(p for p in client.get("/api/fairteiler").json() if p["id"] == 810)
    assert point["status"]["state"] == "etwas_da"
    assert point["activity7d"][-1] == 2


def test_stale_report_means_keine_meldung(client, db):
    thirteen_hours_ago = dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=13)
    crud.create_report(
        db, fairteiler_id=810, type="brought", tags=["obst"],
        device_hash="x", created_at=thirteen_hours_ago,
    )
    db.commit()
    point = next(p for p in client.get("/api/fairteiler").json() if p["id"] == 810)
    assert point["status"]["state"] == "keine_meldung"
    # stale for the status, but still visible in activity and history
    assert sum(point["activity7d"]) == 1


def test_activity_buckets_by_day(client, db):
    now = dt.datetime.now(dt.timezone.utc)
    for days_ago, count in ((0, 2), (1, 1), (6, 3)):
        for _ in range(count):
            crud.create_report(
                db, fairteiler_id=1220, type="taken", tags=[],
                device_hash="x", created_at=now - dt.timedelta(days=days_ago),
            )
    # 8 days ago: outside the window
    crud.create_report(
        db, fairteiler_id=1220, type="taken", tags=[],
        device_hash="x", created_at=now - dt.timedelta(days=8),
    )
    db.commit()
    point = next(p for p in client.get("/api/fairteiler").json() if p["id"] == 1220)
    assert point["activity7d"] == [3, 0, 0, 0, 0, 1, 2]


def test_rate_limit_same_device_same_fairteiler(client):
    assert post_report(client, 810, {"type": "brought", "tags": []}).status_code == 201
    resp = post_report(client, 810, {"type": "empty", "tags": []})
    assert resp.status_code == 429
    assert "Minute" in resp.json()["detail"] or "minute" in resp.json()["detail"].lower()


def test_rate_limit_is_per_fairteiler_and_device(client):
    assert post_report(client, 810, {"type": "brought", "tags": []}, DEVICE_A).status_code == 201
    # same device, other fairteiler: fine
    assert post_report(client, 1220, {"type": "brought", "tags": []}, DEVICE_A).status_code == 201
    # other device, same fairteiler: fine
    assert post_report(client, 810, {"type": "empty", "tags": []}, DEVICE_B).status_code == 201


def test_validation(client):
    assert post_report(client, 810, {"type": "exploded", "tags": []}).status_code == 422
    assert post_report(client, 810, {"type": "brought", "tags": ["pizza"]}).status_code == 422
    # missing device header
    resp = client.post("/api/fairteiler/810/reports", json={"type": "brought", "tags": []})
    assert resp.status_code == 422
    # unknown fairteiler
    assert post_report(client, 999999, {"type": "brought", "tags": []}).status_code == 404
    # virtual entry takes no reports
    assert post_report(client, 1578, {"type": "brought", "tags": []}).status_code == 404
