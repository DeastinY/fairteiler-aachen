"""Fairteiler photos: fetched once by our server, cached, never by the browser."""

from app import photos


def setup_function():
    photos.reset_cache()


def fake_fetch(payload=b"PNGDATA", content_type="image/png"):
    calls = []

    def fetch(url):
        calls.append(url)
        return payload, content_type

    fetch.calls = calls
    return fetch


def test_detail_exposes_photo_url_only_when_a_picture_exists(client):
    with_photo = client.get("/api/fairteiler/1220").json()
    assert with_photo["photoUrl"] == "/api/fairteiler/1220/photo"
    without = client.get("/api/fairteiler/810").json()  # BreitSeite has none
    assert without["photoUrl"] is None


def test_photo_is_fetched_once_and_then_served_from_cache(client, monkeypatch, tmp_path):
    fetch = fake_fetch()
    monkeypatch.setattr(photos, "_fetch_upstream", fetch)
    monkeypatch.setattr(photos, "CACHE_DIR", tmp_path)

    first = client.get("/api/fairteiler/1220/photo")
    assert first.status_code == 200
    assert first.content == b"PNGDATA"
    assert first.headers["content-type"].startswith("image/png")

    second = client.get("/api/fairteiler/1220/photo")
    assert second.status_code == 200
    assert len(fetch.calls) == 1  # cached, upstream untouched
    assert fetch.calls[0].startswith("https://foodsharing.de/api/uploads/")


def test_photo_404_without_picture(client):
    assert client.get("/api/fairteiler/810/photo").status_code == 404


def test_photo_404_for_unknown_fairteiler(client):
    assert client.get("/api/fairteiler/999999/photo").status_code in (404, 422)


def test_upstream_failure_is_404_not_500(client, monkeypatch, tmp_path):
    def broken(url):
        raise OSError("upstream down")

    monkeypatch.setattr(photos, "_fetch_upstream", broken)
    monkeypatch.setattr(photos, "CACHE_DIR", tmp_path)
    assert client.get("/api/fairteiler/1220/photo").status_code == 404


def test_oversized_images_are_rejected(client, monkeypatch, tmp_path):
    monkeypatch.setattr(photos, "_fetch_upstream", fake_fetch(b"x" * (photos.MAX_BYTES + 1)))
    monkeypatch.setattr(photos, "CACHE_DIR", tmp_path)
    assert client.get("/api/fairteiler/1220/photo").status_code == 404


def test_non_image_content_type_is_rejected(client, monkeypatch, tmp_path):
    monkeypatch.setattr(photos, "_fetch_upstream", fake_fetch(b"<html>", "text/html"))
    monkeypatch.setattr(photos, "CACHE_DIR", tmp_path)
    assert client.get("/api/fairteiler/1220/photo").status_code == 404
