"""Anonymous usage counters: daily aggregates, zero identifiers."""

from sqlalchemy import inspect

from app.models import UsageCounter


def test_list_and_detail_views_are_counted(client, db):
    client.get("/api/fairteiler")
    client.get("/api/fairteiler")
    client.get("/api/fairteiler/810")
    client.get("/api/fairteiler/999999")  # 404s are not usage
    db.expire_all()
    rows = {(r.metric): r.count for r in db.query(UsageCounter).all()}
    assert rows["list_views"] == 2
    assert rows["detail_views"] == 1
    assert "detail_views" in rows


def test_counters_aggregate_per_day_and_metric(client, db):
    for _ in range(3):
        client.get("/api/fairteiler")
    db.expire_all()
    rows = db.query(UsageCounter).filter_by(metric="list_views").all()
    assert len(rows) == 1  # one row per (day, metric), not per request
    assert rows[0].count == 3


def test_counters_store_no_identifiers():
    columns = {c.key for c in inspect(UsageCounter).columns}
    assert columns == {"id", "day", "metric", "count"}
    # no ip, no device hash, no user agent — nothing to relate to a person


def test_health_and_stats_are_not_counted(client, db):
    client.get("/api/health")
    client.get("/api/stats")
    db.expire_all()
    metrics = {r.metric for r in db.query(UsageCounter).all()}
    assert metrics == set()


def test_stats_exposes_public_usage_series(client, db):
    client.get("/api/fairteiler")
    client.get("/api/fairteiler/810")
    client.post(
        "/api/fairteiler/810/reports",
        json={"type": "brought", "tags": []},
        headers={"X-Device-Id": "usage-series-dev"},
    )
    stats = client.get("/api/stats").json()
    series = stats["usage14d"]
    assert len(series) == 14
    today = series[-1]
    assert today["listViews"] >= 1
    assert today["detailViews"] >= 1
    assert today["reports"] == 1
    # oldest first, days ISO-formatted, zero-filled
    assert series[0]["day"] < series[-1]["day"]
    assert all(set(e) == {"day", "listViews", "detailViews", "reports"} for e in series)
    assert stats["pushSubscriptions"] == 0


def test_stats_counts_push_subscriptions(push_client):
    push_client.put(
        "/api/push/subscription",
        json={
            "subscription": {"endpoint": "https://push.example/t", "keys": {"p256dh": "p", "auth": "a"}},
            "fairteilerIds": [810],
            "quietHours": False,
        },
        headers={"X-Device-Id": "usage-sub-dev"},
    )
    assert push_client.get("/api/stats").json()["pushSubscriptions"] == 1
