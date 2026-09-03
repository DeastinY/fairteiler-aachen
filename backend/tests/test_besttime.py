"""Best-time-of-day hint: only claimed when the data supports it."""

import datetime as dt

from app import crud
from app.status import best_time_of_day


def brought_at(db, hour, days_ago=1, fid=810, minute=0):
    when = dt.datetime.now(dt.timezone.utc).replace(
        hour=hour, minute=minute, second=0, microsecond=0
    ) - dt.timedelta(days=days_ago)
    return crud.create_report(
        db, fairteiler_id=fid, type="brought", tags=[], device_hash="x",
        created_at=when,
    )


def test_no_hint_with_few_reports(client, db):
    for day in range(1, 4):
        brought_at(db, hour=15, days_ago=day)
    db.commit()
    assert client.get("/api/fairteiler/810").json()["bestTime"] is None


def test_afternoon_dominates(client, db):
    for day in range(1, 6):
        brought_at(db, hour=15, days_ago=day)  # 5x afternoon (UTC 15 = Berlin 17)
    brought_at(db, hour=8, days_ago=6)
    db.commit()
    assert client.get("/api/fairteiler/810").json()["bestTime"] == "afternoon"


def test_no_hint_without_clear_winner(client, db):
    for day in range(1, 4):
        brought_at(db, hour=7, days_ago=day)   # morning (Berlin 9)
    for day in range(4, 7):
        brought_at(db, hour=14, days_ago=day)  # afternoon
    for day in range(7, 10):
        brought_at(db, hour=18, days_ago=day)  # evening (Berlin 20)
    db.commit()
    assert client.get("/api/fairteiler/810").json()["bestTime"] is None


def test_unit_buckets_are_berlin_local():
    # 05:30 UTC in September = 07:30 Berlin -> morning
    reports = []
    for i in range(5):
        r = crud.__class__ if False else None  # noqa  (kept simple below)
    now = dt.datetime.now(dt.timezone.utc)

    class R:
        def __init__(self, hour):
            self.type = "brought"
            self.created_at = now.replace(hour=hour, minute=30) - dt.timedelta(days=1)

    assert best_time_of_day([R(5) for _ in range(5)]) == "morning"
    assert best_time_of_day([R(19) for _ in range(5)]) == "evening"
    assert best_time_of_day([]) is None
