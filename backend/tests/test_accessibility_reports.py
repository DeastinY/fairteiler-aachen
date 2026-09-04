"""Community-reported accessibility: fills the gaps curation cannot."""

import datetime as dt

from app import crud

DEV = "access-device"


def vote(client, fid, type_, dev=DEV):
    return client.post(
        f"/api/fairteiler/{fid}/reports",
        json={"type": type_, "tags": []},
        headers={"X-Device-Id": dev},
    )


def get(client, fid):
    return next(p for p in client.get("/api/fairteiler").json() if p["id"] == fid)


def test_access_report_types_are_accepted(client):
    assert vote(client, 1982, "access_ok").status_code == 201
    assert vote(client, 1981, "access_hard").status_code == 201


def test_unknown_becomes_community_knowledge(client):
    assert get(client, 1982)["accessible"] is None
    vote(client, 1982, "access_ok")
    point = get(client, 1982)
    assert point["accessible"] is True
    assert point["accessibleSource"] == "community"
    detail = client.get("/api/fairteiler/1982").json()
    assert detail["accessible"] is True
    assert detail["accessibleSource"] == "community"


def test_majority_decides_and_ties_stay_unknown(client):
    for i in range(3):
        vote(client, 1982, "access_hard", dev=f"dev-hard-{i}")
    for i in range(2):
        vote(client, 1982, "access_ok", dev=f"dev-ok-{i}")
    assert get(client, 1982)["accessible"] is False

    vote(client, 1982, "access_ok", dev="dev-ok-tie")  # 3:3
    assert get(client, 1982)["accessible"] is None


def test_curated_facts_beat_community_votes(client):
    # 810 is curated step-free; votes must not override the operator's own text
    for i in range(4):
        vote(client, 810, "access_hard", dev=f"dev-{i}")
    point = get(client, 810)
    assert point["accessible"] is True
    assert point["accessibleSource"] == "curated"


def test_stale_votes_are_ignored(client, db):
    crud.create_report(
        db, fairteiler_id=1982, type="access_ok", tags=[], device_hash="old",
        created_at=dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=400),
    )
    db.commit()
    assert get(client, 1982)["accessible"] is None


def test_access_votes_do_not_change_food_status(client):
    vote(client, 1982, "access_hard")
    point = get(client, 1982)
    assert point["status"]["state"] == "keine_meldung"
