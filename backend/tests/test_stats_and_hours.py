"""Stats endpoint, opening hours, and report ids in detail responses."""

import datetime as dt

from app.hours import is_open_now
from app.models import Fairteiler


def test_detail_reports_carry_ids(client):
    created = client.post(
        "/api/fairteiler/810/reports",
        json={"type": "brought", "tags": []},
        headers={"X-Device-Id": "ids-device"},
    ).json()
    detail = client.get("/api/fairteiler/810").json()
    assert detail["reports"][0]["id"] == created["id"]


def test_stats_endpoint(client):
    for i, fid in enumerate((810, 810, 1220)):
        client.post(
            f"/api/fairteiler/{fid}/reports",
            json={"type": "brought", "tags": []},
            headers={"X-Device-Id": f"stats-device-{i}"},
        )
    stats = client.get("/api/stats").json()
    assert stats["reports7d"] == 3
    assert stats["fairteilerTotal"] == 11
    assert stats["withFood"] == 2  # 810 and 1220 currently etwas_da


def test_hours_in_responses(client):
    # BreitSeite has curated hours (Mo-Fr 10-18, Sa 10-16)
    detail = client.get("/api/fairteiler/810").json()
    assert detail["hours"] is not None
    assert "openNow" in detail
    # 24/7 fairteiler: open, no hours table needed
    always = client.get("/api/fairteiler/1220").json()
    assert always["aroundTheClock"] is True
    assert always["openNow"] is True
    listed = next(p for p in client.get("/api/fairteiler").json() if p["id"] == 810)
    assert "openNow" in listed


def _fairteiler(**kwargs):
    defaults = dict(id=1, name="x", lat=0.0, lon=0.0, cooled=False, around_the_clock=False)
    defaults.update(kwargs)
    return Fairteiler(**defaults)


def test_is_open_now_logic():
    hours = {"mo": [[10, 18]], "sa": [[10, 16]]}
    fairteiler = _fairteiler(hours=hours)
    monday_noon = dt.datetime(2026, 8, 31, 12, 0)  # a Monday
    monday_night = dt.datetime(2026, 8, 31, 19, 0)
    sunday = dt.datetime(2026, 9, 6, 12, 0)
    assert is_open_now(fairteiler, monday_noon) is True
    assert is_open_now(fairteiler, monday_night) is False
    assert is_open_now(fairteiler, sunday) is False

    always = _fairteiler(around_the_clock=True, hours=None)
    assert is_open_now(always, monday_night) is True

    unknown = _fairteiler(hours=None)
    assert is_open_now(unknown, monday_noon) is None
