"""Derived fairteiler attributes: cooled / around-the-clock from descriptions."""

from app.seed import derive_flags


def get(client, fid):
    return next(p for p in client.get("/api/fairteiler").json() if p["id"] == fid)


def test_flags_exposed_in_list_and_detail(client):
    point = get(client, 795)
    assert "cooled" in point and "aroundTheClock" in point
    detail = client.get("/api/fairteiler/795").json()
    assert "cooled" in detail and "aroundTheClock" in detail


def test_pfannenzauber_has_fridge(client):
    # description: "- Regal - Kühlschrank Im Restaurant ..."
    assert get(client, 795)["cooled"] is True


def test_villa_kunterbund_around_the_clock(client):
    # description: "... ganztägig und öffentlich begehbar ..."
    assert get(client, 1220)["aroundTheClock"] is True


def test_breitseite_neither(client):
    # description: opening hours Mo-Fr, second-hand shop shelf
    point = get(client, 810)
    assert point["aroundTheClock"] is False


def test_cooled_negations_from_real_descriptions(client):
    # 1981: "Es gibt hier **keinen** Kühlschrank."
    assert get(client, 1981)["cooled"] is False
    # 2420: "ein roter ungebauter Kühlschrank - der nicht mehr kühlt"
    assert get(client, 2420)["cooled"] is False
    # 1411: "ein roter Kühlschrank, der als Schrank umgebaut wurde"
    assert get(client, 1411)["cooled"] is False
    # positives stay positive
    assert get(client, 795)["cooled"] is True
    assert get(client, 810)["cooled"] is True
    assert get(client, 2383)["cooled"] is True


def test_derive_flags_negation_phrases():
    assert derive_flags("Es gibt hier **keinen** Kühlschrank.")["cooled"] is False
    assert derive_flags("kein Kühlschrank vorhanden")["cooled"] is False
    assert derive_flags("ohne Kühlschrank")["cooled"] is False
    assert derive_flags("ein Kühlschrank, der nicht mehr kühlt")["cooled"] is False
    assert derive_flags("Kühlschrank, als Schrank umgebaut")["cooled"] is False
    assert derive_flags("ein Regal und ein Kühlschrank")["cooled"] is True


def test_derive_flags_heuristics():
    assert derive_flags("Ein Kühlschrank steht bereit") == {
        "cooled": True,
        "around_the_clock": False,
    }
    assert derive_flags("jederzeit zugänglich")["around_the_clock"] is True
    assert derive_flags("immer zugänglich")["around_the_clock"] is True
    assert derive_flags("rund um die Uhr offen")["around_the_clock"] is True
    assert derive_flags("GANZTÄGIG geöffnet")["around_the_clock"] is True
    assert derive_flags(None) == {"cooled": False, "around_the_clock": False}


def test_migrate_adds_missing_columns():
    from sqlalchemy import create_engine, text

    from app.db import migrate

    engine = create_engine("sqlite://")
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE fairteiler (id INTEGER PRIMARY KEY, name TEXT)"))
    assert sorted(migrate(engine)) == [
        "fairteiler.accessible",
        "fairteiler.around_the_clock",
        "fairteiler.cooled",
        "fairteiler.hours",
    ]
    assert migrate(engine) == []  # idempotent


def test_accessibility_comes_from_curated_overrides(client):
    by_id = {p["id"]: p for p in client.get("/api/fairteiler").json()}
    # stated in the upstream descriptions
    assert by_id[810]["accessible"] is True      # ebenerdiger Eingang
    assert by_id[3465]["accessible"] is True     # "Der Zugang ist barrierefrei!"
    assert by_id[795]["accessible"] is False     # mehrere Stufen am Eingang
    assert by_id[1220]["accessible"] is False    # Einfahrt uneben, Fächer hoch
    # never guessed: unknown stays unknown
    assert by_id[1982]["accessible"] is None
    assert client.get("/api/fairteiler/810").json()["accessible"] is True
