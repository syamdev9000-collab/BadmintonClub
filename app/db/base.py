"""
Declarative Base for SQLAlchemy models.

Why this file exists:
- Every ORM model (e.g. the User table) needs to inherit from a common
  "Base" class. SQLAlchemy uses this to know about all your tables when
  creating them or generating migrations.
- Keeping Base in its own tiny file (rather than in session.py) avoids
  circular imports: models import Base from here, and alembic/session
  import Base from here too, without needing to import each other.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """All ORM models inherit from this."""

    pass
