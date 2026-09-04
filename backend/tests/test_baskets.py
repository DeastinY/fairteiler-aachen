"""Baskets proxy: lazy server-side cache, throttled, capped, bbox-filtered."""

import datetime as dt

from app import baskets


def setup_function():
    baskets.reset_cache()


def fake_fetcher(items):
    calls = []

    def fetch():
        calls.append(1)
        return items

    fetch.calls = calls
    return fetch


AACHEN_BASKET = {"id": 501, "lat": 50.776, "lon": 6.084}
BERLIN_BASKET = {"id": 502, "lat": 52.52, "lon": 13.4}


def test_bbox_filter_and_shape(client, monkeypatch):
    monkeypatch.setattr(baskets, "_fetch_upstream", fake_fetcher([AACHEN_BASKET, BERLIN_BASKET]))
    data = client.get("/api/baskets").json()
    assert data["baskets"] == [{"id": 501, "lat": 50.776, "lon": 6.084}]
    assert data["stale"] is False
    assert data["fetchedAt"] is not None


def test_cache_within_ttl_single_upstream_call(client, monkeypatch):
    fetch = fake_fetcher([AACHEN_BASKET])
    monkeypatch.setattr(baskets, "_fetch_upstream", fetch)
    for _ in range(5):
        client.get("/api/baskets")
    assert len(fetch.calls) == 1


def test_ttl_expiry_refetches(client, monkeypatch):
    fetch = fake_fetcher([AACHEN_BASKET])
    monkeypatch.setattr(baskets, "_fetch_upstream", fetch)
    client.get("/api/baskets")
    # age the cache beyond the TTL
    baskets._cache["fetched_at"] -= dt.timedelta(minutes=baskets.TTL_MINUTES + 1)
    client.get("/api/baskets")
    assert len(fetch.calls) == 2


def test_upstream_failure_serves_stale(client, monkeypatch):
    fetch = fake_fetcher([AACHEN_BASKET])
    monkeypatch.setattr(baskets, "_fetch_upstream", fetch)
    client.get("/api/baskets")
    baskets._cache["fetched_at"] -= dt.timedelta(minutes=baskets.TTL_MINUTES + 1)

    def broken():
        raise OSError("upstream down")

    monkeypatch.setattr(baskets, "_fetch_upstream", broken)
    data = client.get("/api/baskets").json()
    assert data["baskets"] == [{"id": 501, "lat": 50.776, "lon": 6.084}]
    assert data["stale"] is True


def test_empty_cache_with_failure_is_graceful(client, monkeypatch):
    def broken():
        raise OSError("upstream down")

    monkeypatch.setattr(baskets, "_fetch_upstream", broken)
    data = client.get("/api/baskets").json()
    assert data["baskets"] == []
    assert data["stale"] is True
    assert data["fetchedAt"] is None


def test_daily_cap(client, monkeypatch):
    fetch = fake_fetcher([AACHEN_BASKET])
    monkeypatch.setattr(baskets, "_fetch_upstream", fetch)
    monkeypatch.setattr(baskets, "TTL_MINUTES", 0)  # every request wants a refresh
    for _ in range(baskets.DAILY_CAP + 10):
        client.get("/api/baskets")
    assert len(fetch.calls) == baskets.DAILY_CAP
