"""Deleting one's own recent report (undo for accidental submissions)."""

import datetime as dt

from app import crud

DEVICE_A = {"X-Device-Id": "undo-device-a"}
DEVICE_B = {"X-Device-Id": "undo-device-b"}


def create(client, headers=DEVICE_A, fid=810):
    return client.post(
        f"/api/fairteiler/{fid}/reports",
        json={"type": "brought", "tags": ["obst"]},
        headers=headers,
    )


def test_create_returns_id(client):
    body = create(client).json()
    assert isinstance(body["id"], int)


def test_own_report_deleted_within_window(client):
    report_id = create(client).json()["id"]
    resp = client.delete(f"/api/reports/{report_id}", headers=DEVICE_A)
    assert resp.status_code == 204
    point = next(p for p in client.get("/api/fairteiler").json() if p["id"] == 810)
    assert point["status"]["state"] == "keine_meldung"
    assert point["activity7d"] == [0] * 7


def test_foreign_report_is_forbidden(client):
    report_id = create(client).json()["id"]
    resp = client.delete(f"/api/reports/{report_id}", headers=DEVICE_B)
    assert resp.status_code == 403


def test_old_report_is_forbidden(client, db):
    report = crud.create_report(
        db, fairteiler_id=810, type="brought", tags=[],
        device_hash=crud.hash_device("undo-device-a"),
        created_at=dt.datetime.now(dt.timezone.utc) - dt.timedelta(minutes=16),
    )
    db.commit()
    resp = client.delete(f"/api/reports/{report.id}", headers=DEVICE_A)
    assert resp.status_code == 403
    assert "Minuten" in resp.json()["detail"]


def test_unknown_report_404(client):
    assert client.delete("/api/reports/999999", headers=DEVICE_A).status_code == 404


def test_can_report_again_after_undo(client):
    report_id = create(client).json()["id"]
    client.delete(f"/api/reports/{report_id}", headers=DEVICE_A)
    # rate limit must not lock the corrected report out
    assert create(client).status_code == 201
