"""
Database engine and session management.

Why this file exists:
- `engine`: the connection pool to PostgreSQL. Created ONCE when the app
  starts, reused for the app's whole lifetime. Creating a new engine per
  request would be very slow and would exhaust database connections.
- `SessionLocal`: a factory that creates new Session objects. A Session is
  a single "unit of work" — you open one per HTTP request, run your
  queries, commit or rollback, then close it.
- `get_db()`: a FastAPI dependency. FastAPI calls this for every request
  that needs a database session. The `yield` pattern guarantees the
  session is closed afterward (even if the request raises an exception),
  using a try/finally under the hood.

How other files use this:
- Repositories receive a `Session` object (via dependency injection) and
  use it to run queries — they never create their own engine/session.
- `app/api/deps.py` will import `get_db` and expose it to routes via
  FastAPI's `Depends(get_db)`.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,  # checks connections are alive before using them
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


def get_db() -> Generator[Session, None, None]:
    """Yield a database session, and always close it afterward."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
