"""Optional Telegram bridge: mirrors 'brought' reports into the community's
Bezirk group. DARK by default — activates only when TELEGRAM_BOT_TOKEN and
TELEGRAM_CHAT_ID are set AND the group admins have agreed. Messages carry
no personal data (reports are anonymous).
"""

import json
import logging
import os
import urllib.request
from dataclasses import dataclass

from app.push import TAG_LABELS

logger = logging.getLogger(__name__)

APP_URL = os.environ.get("FAIRTEILER_APP_URL", "https://deastiny.uber.space")


@dataclass(frozen=True)
class TelegramSettings:
    bot_token: str
    chat_id: str


def settings_from_env() -> TelegramSettings | None:
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    if not (token and chat_id):
        return None
    return TelegramSettings(bot_token=token, chat_id=chat_id)


def build_message(fairteiler_name: str, tags: list[str]) -> str:
    labels = [TAG_LABELS.get(t, t) for t in tags]
    line = f"{fairteiler_name}: Etwas wurde gebracht"
    if labels:
        line += " – " + ", ".join(labels)
    return f"{line}\nLive-Status: {APP_URL}"


def _post(url: str, data: dict) -> None:
    request = urllib.request.Request(
        url,
        data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json"},
    )
    urllib.request.urlopen(request, timeout=10)


def notify_brought(fairteiler_name: str, tags: list[str]) -> None:
    """Best-effort; never raises into the report request."""
    settings = settings_from_env()
    if settings is None:
        return
    try:
        _post(
            f"https://api.telegram.org/bot{settings.bot_token}/sendMessage",
            {
                "chat_id": settings.chat_id,
                "text": build_message(fairteiler_name, tags),
                "disable_notification": True,
            },
        )
    except Exception:  # noqa: BLE001
        logger.exception("telegram notify failed")
