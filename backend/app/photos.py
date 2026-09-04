"""Fairteiler photos from foodsharing.de, proxied and cached by our server.

Why proxied rather than hotlinked: a browser loading the image directly would
hand foodsharing.de the visitor's IP on every page view. Our server fetches
each picture once, keeps it on disk, and serves it from there — foodsharing
sees a single request per photo, ever, and visitors stay anonymous.

These are the pictures of the cabinets that foodsharing already publishes
on its own public pages — not user-submitted food photos, which the app
deliberately does not have.
"""

import logging
import pathlib
import urllib.request

logger = logging.getLogger(__name__)

BASE = "https://foodsharing.de"
USER_AGENT = "fairteiler-aachen/1.0 (+https://github.com/DeastinY/fairteiler-aachen)"
MAX_BYTES = 8 * 1024 * 1024
CACHE_DIR = pathlib.Path("photo-cache")

EXTENSIONS = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp"}


def reset_cache() -> None:
    """Test helper: forget which files we believe are cached."""
    _cached.clear()


_cached: dict[int, pathlib.Path] = {}


def _fetch_upstream(url: str) -> tuple[bytes, str]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=20) as response:
        content_type = (response.headers.get("Content-Type") or "").split(";")[0].strip()
        return response.read(MAX_BYTES + 1), content_type


def get_photo(fairteiler_id: int, picture_path: str | None) -> tuple[bytes, str] | None:
    """Cached bytes + content type, or None when there is nothing to show."""
    if not picture_path:
        return None

    cached = _cached.get(fairteiler_id)
    if cached and cached.exists():
        suffix = cached.suffix
        content_type = next(
            (ct for ct, ext in EXTENSIONS.items() if ext == suffix), "image/png"
        )
        return cached.read_bytes(), content_type

    url = picture_path if picture_path.startswith("http") else BASE + picture_path
    try:
        data, content_type = _fetch_upstream(url)
    except Exception:  # noqa: BLE001 — a missing photo is not an error worth 500ing
        logger.warning("photo fetch failed for fairteiler %s", fairteiler_id)
        return None

    if content_type not in EXTENSIONS or len(data) > MAX_BYTES:
        logger.warning(
            "photo for fairteiler %s rejected (%s, %d bytes)",
            fairteiler_id,
            content_type,
            len(data),
        )
        return None

    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        path = CACHE_DIR / f"{fairteiler_id}{EXTENSIONS[content_type]}"
        path.write_bytes(data)
        _cached[fairteiler_id] = path
    except OSError:
        logger.warning("photo cache write failed for fairteiler %s", fairteiler_id)

    return data, content_type
