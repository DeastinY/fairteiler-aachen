"""Web push: subscription management and dispatch on 'brought' reports."""

import datetime as dt

import pytest

from app import push
from app.models import PushSubscription

SUB_A = {
    "subscription": {
        "endpoint": "https://push.example/ep-a",
        "keys": {"p256dh": "key-a", "auth": "auth-a"},
    },
    "fairteilerIds": [810, 1220],
    "quietHours": False,
}
DEVICE = {"X-Device-Id": "device-push"}


def put_sub(client, body=SUB_A):
    return client.put("/api/push/subscription", json=body, headers=DEVICE)


# --- config ---------------------------------------------------------------

def test_config_disabled_without_keys(client):
    resp = client.get("/api/push/config")
    assert resp.status_code == 200
    assert resp.json() == {"enabled": False, "vapidPublicKey": None}


def test_config_enabled_with_keys(push_client):
    resp = push_client.get("/api/push/config")
    assert resp.json() == {"enabled": True, "vapidPublicKey": "test-public-key"}


# --- subscription CRUD ----------------------------------------------------

def test_put_subscription_upserts(push_client, db):
    assert put_sub(push_client).status_code == 204
    body = dict(SUB_A, fairteilerIds=[810])
    assert put_sub(push_client, body).status_code == 204
    subs = db.query(PushSubscription).all()
    assert len(subs) == 1
    assert subs[0].fairteiler_ids == [810]


def test_put_empty_ids_unsubscribes(push_client, db):
    put_sub(push_client)
    assert put_sub(push_client, dict(SUB_A, fairteilerIds=[])).status_code == 204
    assert db.query(PushSubscription).count() == 0


def test_put_unknown_fairteiler_rejected(push_client):
    resp = put_sub(push_client, dict(SUB_A, fairteilerIds=[999999]))
    assert resp.status_code == 422


def test_put_disabled_server_returns_503(client):
    assert put_sub(client).status_code == 503


# --- dispatch -------------------------------------------------------------

def test_brought_report_notifies_matching_subscriptions(push_client, sent):
    put_sub(push_client)
    resp = push_client.post(
        "/api/fairteiler/810/reports",
        json={"type": "brought", "tags": ["brot_backwaren"]},
        headers={"X-Device-Id": "reporter-1"},
    )
    assert resp.status_code == 201
    assert len(sent) == 1
    endpoint, payload = sent[0]
    assert endpoint == "https://push.example/ep-a"
    assert payload["title"] == 'Fairteiler "BreitSeite"'
    assert "Brot & Backwaren" in payload["body"]
    assert payload["url"] == "/fairteiler/810"
    assert payload["tag"] == "fairteiler-810"


def test_other_fairteiler_not_notified(push_client, sent):
    put_sub(push_client)
    push_client.post(
        "/api/fairteiler/1981/reports",  # not subscribed
        json={"type": "brought", "tags": []},
        headers={"X-Device-Id": "reporter-1"},
    )
    assert sent == []


def test_taken_and_empty_do_not_notify(push_client, sent):
    put_sub(push_client)
    for i, type_ in enumerate(("taken", "empty")):
        push_client.post(
            "/api/fairteiler/810/reports",
            json={"type": type_, "tags": []},
            headers={"X-Device-Id": f"reporter-{i}"},
        )
    assert sent == []


def test_gone_endpoint_is_removed(push_client, db, monkeypatch):
    put_sub(push_client)

    def gone_sender(subscription_info, payload, **kwargs):
        raise push.EndpointGone()

    monkeypatch.setattr(push, "_send_webpush", gone_sender)
    push_client.post(
        "/api/fairteiler/810/reports",
        json={"type": "brought", "tags": []},
        headers={"X-Device-Id": "reporter-1"},
    )
    assert db.query(PushSubscription).count() == 0


# --- quiet hours ----------------------------------------------------------

@pytest.mark.parametrize(
    "hour_berlin,expected_sent",
    [(22, 0), (7, 0), (12, 1), (20, 1), (8, 1)],
)
def test_quiet_hours(push_client, sent, monkeypatch, hour_berlin, expected_sent):
    put_sub(push_client, dict(SUB_A, quietHours=True))
    fake_berlin_now = dt.datetime(2026, 9, 3, hour_berlin, 30)
    monkeypatch.setattr(push, "_berlin_now", lambda: fake_berlin_now)
    push_client.post(
        "/api/fairteiler/810/reports",
        json={"type": "brought", "tags": []},
        headers={"X-Device-Id": "reporter-1"},
    )
    assert len(sent) == expected_sent


# --- empty alerts (for people who like to bring something) ----------------

EMPTY_SUB = {
    "subscription": {
        "endpoint": "https://push.example/empty-fan",
        "keys": {"p256dh": "k", "auth": "a"},
    },
    "fairteilerIds": [810],
    "quietHours": False,
    "emptyAlerts": True,
}


def test_empty_report_notifies_only_empty_alert_subscribers(push_client, sent):
    push_client.put("/api/push/subscription", json=SUB_A, headers=DEVICE)  # brought-only
    push_client.put(
        "/api/push/subscription", json=EMPTY_SUB, headers={"X-Device-Id": "empty-dev"}
    )
    push_client.post(
        "/api/fairteiler/810/reports",
        json={"type": "empty", "tags": []},
        headers={"X-Device-Id": "reporter-empty"},
    )
    assert len(sent) == 1
    endpoint, payload = sent[0]
    assert endpoint == "https://push.example/empty-fan"
    assert payload["url"] == "/fairteiler/810"
    assert payload["tag"] == "fairteiler-810-empty"
    assert "leer" in payload["body"].lower()


def test_empty_alerts_respect_followed_fairteiler(push_client, sent):
    push_client.put(
        "/api/push/subscription", json=EMPTY_SUB, headers={"X-Device-Id": "empty-dev"}
    )
    push_client.post(
        "/api/fairteiler/1220/reports",  # not followed
        json={"type": "empty", "tags": []},
        headers={"X-Device-Id": "reporter-empty"},
    )
    assert sent == []


def test_empty_alerts_respect_quiet_hours(push_client, sent, monkeypatch):
    push_client.put(
        "/api/push/subscription",
        json={**EMPTY_SUB, "quietHours": True},
        headers={"X-Device-Id": "empty-dev"},
    )
    monkeypatch.setattr(push, "_berlin_now", lambda: dt.datetime(2026, 9, 4, 23, 0))
    push_client.post(
        "/api/fairteiler/810/reports",
        json={"type": "empty", "tags": []},
        headers={"X-Device-Id": "reporter-empty"},
    )
    assert sent == []
