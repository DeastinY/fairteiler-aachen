"""Messenger group links endpoint and the (dark) Telegram bridge."""

from app import telegram
from app.telegram import TelegramSettings


def test_groups_endpoint(client):
    groups = client.get("/api/groups").json()["groups"]
    kinds = {g["kind"] for g in groups}
    assert kinds == {"telegram", "signal", "whatsapp"}
    assert all(g["url"].startswith("https://") for g in groups)
    assert all(g["name"] for g in groups)


def test_telegram_message_format():
    text = telegram.build_message(
        'Fairteiler "BreitSeite"', ["brot_backwaren", "gemuese"]
    )
    assert "BreitSeite" in text
    assert "Brot & Backwaren" in text and "Gemüse" in text
    assert "https://deastiny.uber.space" in text  # deep link to the app


def test_telegram_disabled_without_settings(client, sent, monkeypatch):
    calls = []
    monkeypatch.setattr(telegram, "_post", lambda *a, **k: calls.append(a))
    client.post(
        "/api/fairteiler/810/reports",
        json={"type": "brought", "tags": []},
        headers={"X-Device-Id": "tg-device"},
    )
    assert calls == []  # no token configured -> nothing sent


def test_telegram_notify_called_on_brought(push_client, sent, monkeypatch):
    calls = []
    monkeypatch.setattr(telegram, "_post", lambda url, data: calls.append((url, data)))
    settings = TelegramSettings(bot_token="TOKEN", chat_id="-100123")
    monkeypatch.setattr(telegram, "settings_from_env", lambda: settings)
    push_client.post(
        "/api/fairteiler/810/reports",
        json={"type": "brought", "tags": ["obst"]},
        headers={"X-Device-Id": "tg-device-2"},
    )
    assert len(calls) == 1
    url, data = calls[0]
    assert "botTOKEN/sendMessage" in url
    assert data["chat_id"] == "-100123"
    assert "Obst" in data["text"]

    # taken must not post
    push_client.post(
        "/api/fairteiler/810/reports",
        json={"type": "taken", "tags": []},
        headers={"X-Device-Id": "tg-device-3"},
    )
    assert len(calls) == 1
