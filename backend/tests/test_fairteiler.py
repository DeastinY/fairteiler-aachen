"""Fairteiler master data endpoints."""


def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_list_contains_physical_fairteiler_only(client):
    resp = client.get("/api/fairteiler")
    assert resp.status_code == 200
    points = resp.json()
    ids = {p["id"] for p in points}
    assert 810 in ids  # BreitSeite
    assert 1220 in ids  # Villa Kunterbund
    assert 1578 not in ids  # virtual messenger-groups entry is excluded
    assert len(points) == 11


def test_list_item_shape(client):
    point = next(
        p for p in client.get("/api/fairteiler").json() if p["id"] == 810
    )
    assert point["name"] == 'Fairteiler "BreitSeite"'
    assert point["street"] == "Kleinkölnstraße 18"
    assert point["postalCode"] == "52062"
    assert point["city"] == "Aachen"
    assert isinstance(point["lat"], float)
    assert isinstance(point["lon"], float)
    # no report yet
    assert point["status"] == {"state": "keine_meldung", "lastReportAt": None, "tags": []}
    assert point["activity7d"] == [0, 0, 0, 0, 0, 0, 0]
    # description belongs to the detail view, not the list
    assert "description" not in point


def test_detail(client):
    resp = client.get("/api/fairteiler/810")
    assert resp.status_code == 200
    detail = resp.json()
    assert detail["name"] == 'Fairteiler "BreitSeite"'
    assert "Öffnungszeiten" in detail["description"]
    assert detail["reports"] == []
    assert detail["status"]["state"] == "keine_meldung"


def test_detail_unknown_id_is_404(client):
    assert client.get("/api/fairteiler/999999").status_code == 404


def test_detail_virtual_entry_is_404(client):
    assert client.get("/api/fairteiler/1578").status_code == 404
