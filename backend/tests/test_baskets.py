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


# --- basket notifications -------------------------------------------------

BASKET_SUB = {
    "subscription": {
        "endpoint": "https://push.example/basket-fan",
        "keys": {"p256dh": "k", "auth": "a"},
    },
    "fairteilerIds": [810],
    "quietHours": False,
    "baskets": True,
}


def test_put_stores_baskets_flag(push_client, db):
    from app.models import PushSubscription

    assert (
        push_client.put(
            "/api/push/subscription", json=BASKET_SUB, headers={"X-Device-Id": "bsub"}
        ).status_code
        == 204
    )
    assert db.query(PushSubscription).one().baskets is True


def test_first_fetch_seeds_silently(push_client, sent, monkeypatch):
    push_client.put("/api/push/subscription", json=BASKET_SUB, headers={"X-Device-Id": "bsub"})
    monkeypatch.setattr(baskets, "_fetch_upstream", fake_fetcher([AACHEN_BASKET]))
    push_client.get("/api/baskets")
    assert sent == []  # existing baskets on first sight never notify


def test_new_basket_notifies_only_basket_subscribers(push_client, sent, monkeypatch, db):
    # subscriber without baskets flag
    push_client.put(
        "/api/push/subscription",
        json={**BASKET_SUB, "baskets": False,
              "subscription": {"endpoint": "https://push.example/no-baskets",
                               "keys": {"p256dh": "k", "auth": "a"}}},
        headers={"X-Device-Id": "nosub"},
    )
    push_client.put("/api/push/subscription", json=BASKET_SUB, headers={"X-Device-Id": "bsub"})

    monkeypatch.setattr(baskets, "_fetch_upstream", fake_fetcher([AACHEN_BASKET]))
    push_client.get("/api/baskets")  # seeds
    baskets._cache["fetched_at"] -= dt.timedelta(minutes=baskets.TTL_MINUTES + 1)

    new_basket = {"id": 777, "lat": 50.78, "lon": 6.09}
    monkeypatch.setattr(baskets, "_fetch_upstream", fake_fetcher([AACHEN_BASKET, new_basket]))
    push_client.get("/api/baskets")

    assert len(sent) == 1
    endpoint, payload = sent[0]
    assert endpoint == "https://push.example/basket-fan"
    assert payload["url"] == "/"
    assert payload["tag"] == "basket-777"

    # same basket again: no repeat notification
    baskets._cache["fetched_at"] -= dt.timedelta(minutes=baskets.TTL_MINUTES + 1)
    push_client.get("/api/baskets")
    assert len(sent) == 1


def test_vanished_baskets_are_pruned_from_seen(push_client, sent, monkeypatch, db):
    from app.models import BasketSeen

    monkeypatch.setattr(baskets, "_fetch_upstream", fake_fetcher([AACHEN_BASKET]))
    push_client.get("/api/baskets")
    baskets._cache["fetched_at"] -= dt.timedelta(minutes=baskets.TTL_MINUTES + 1)
    monkeypatch.setattr(baskets, "_fetch_upstream", fake_fetcher([]))
    push_client.get("/api/baskets")
    assert db.query(BasketSeen).count() == 0
