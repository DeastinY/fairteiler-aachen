from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    pass


def make_engine(url: str):
    kwargs = {}
    if url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
        if url in ("sqlite://", "sqlite:///:memory:"):
            from sqlalchemy.pool import StaticPool

            kwargs["poolclass"] = StaticPool
    engine = create_engine(url, **kwargs)
    from app import models  # noqa: F401  (register tables)

    Base.metadata.create_all(engine)
    return engine


def make_session_factory(engine):
    return sessionmaker(bind=engine, expire_on_commit=False)


def migrate(engine) -> list[str]:
    """Add columns that create_all won't add to existing tables."""
    from sqlalchemy import inspect, text

    wanted = {
        "fairteiler": {
            "cooled": "BOOLEAN NOT NULL DEFAULT 0",
            "around_the_clock": "BOOLEAN NOT NULL DEFAULT 0",
        },
    }
    added = []
    inspector = inspect(engine)
    with engine.begin() as conn:
        for table, columns in wanted.items():
            if table not in inspector.get_table_names():
                continue
            existing = {c["name"] for c in inspector.get_columns(table)}
            for name, ddl in columns.items():
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))
                    added.append(f"{table}.{name}")
    return added
