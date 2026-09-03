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
        "fairteiler.around_the_clock",
        "fairteiler.cooled",
    ]
    assert migrate(engine) == []  # idempotent
