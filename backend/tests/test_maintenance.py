"""Retention cleanup and device blocking (moderation)."""

import datetime as dt

from app import crud, maintenance
from app.models import BlockedDevice, Report

DEVICE = {"X-Device-Id": "device-mod"}


def old_report(db, days, fairteiler_id=810):
    return crud.create_report(
        db, fairteiler_id=fairteiler_id, type="taken", tags=[],
        device_hash="x",
        created_at=dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days),
    )


def test_prune_deletes_only_expired_reports(client, db):
    old_report(db, days=91)
    old_report(db, days=89)
    keep = old_report(db, days=1)
    db.commit()
    deleted = maintenance.prune_reports(db, retention_days=90)
    db.commit()
    assert deleted == 1
    remaining = db.query(Report).all()
    assert {r.id for r in remaining} == {keep.id, keep.id - 1}


def test_blocked_device_cannot_report(client, db):
    # first report succeeds and reveals the stored hash
    resp = client.post(
        "/api/fairteiler/810/reports",
        json={"type": "brought", "tags": []},
        headers=DEVICE,
    )
    assert resp.status_code == 201
    device_hash = db.query(Report).one().device_hash

    maintenance.block_device(db, device_hash, reason="spam test")
    db.commit()

    resp = client.post(
        "/api/fairteiler/1220/reports",
        json={"type": "brought", "tags": []},
        headers=DEVICE,
    )
    assert resp.status_code == 403

    maintenance.unblock_device(db, device_hash)
    db.commit()
    resp = client.post(
        "/api/fairteiler/1220/reports",
        json={"type": "brought", "tags": []},
        headers=DEVICE,
    )
    assert resp.status_code == 201


def test_block_is_idempotent(db):
    maintenance.block_device(db, "abc", reason="x")
    maintenance.block_device(db, "abc", reason="x")
    db.commit()
    assert db.query(BlockedDevice).count() == 1
    assert maintenance.unblock_device(db, "missing") is False
