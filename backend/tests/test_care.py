"""Condition reports: cleaned / needs_cleaning / needs_maintenance."""

import datetime as dt

from app import crud

DEVICE = {"X-Device-Id": "care-device"}


def report(client, type_, device="care-device", fid=810):
    return client.post(
        f"/api/fairteiler/{fid}/reports",
        json={"type": type_, "tags": []},
        headers={"X-Device-Id": device},
    )


def get(client, fid=810):
    return next(p for p in client.get("/api/fairteiler").json() if p["id"] == fid)


def test_condition_types_accepted_and_listed(client):
    resp = report(client, "needs_cleaning")
    assert resp.status_code == 201
    detail = client.get("/api/fairteiler/810").json()
    assert detail["reports"][0]["type"] == "needs_cleaning"


def test_condition_reports_do_not_change_food_status(client):
    report(client, "brought", device="dev-a")
    report(client, "needs_cleaning", device="dev-b")
    point = get(client)
    assert point["status"]["state"] == "etwas_da"
    assert point["activity7d"][-1] == 2


def test_care_flags_set_and_cleared_by_cleaned(client):
    assert get(client)["care"] == {"needsCleaning": False, "needsMaintenance": False}
    report(client, "needs_cleaning", device="dev-a")
    report(client, "needs_maintenance", device="dev-b")
    assert get(client)["care"] == {"needsCleaning": True, "needsMaintenance": True}
    report(client, "cleaned", device="dev-c")
    assert get(client)["care"] == {"needsCleaning": False, "needsMaintenance": False}


def test_care_flags_expire(client, db):
    crud.create_report(
        db, fairteiler_id=810, type="needs_maintenance", tags=[], device_hash="x",
        created_at=dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=15),
    )
    db.commit()
    assert get(client)["care"]["needsMaintenance"] is False


def test_cleaned_before_problem_does_not_clear_it(client):
    report(client, "cleaned", device="dev-a")
    report(client, "needs_cleaning", device="dev-b")
    assert get(client)["care"]["needsCleaning"] is True


def test_care_in_detail_response(client):
    report(client, "needs_maintenance", device="dev-a")
    detail = client.get("/api/fairteiler/810").json()
    assert detail["care"]["needsMaintenance"] is True
