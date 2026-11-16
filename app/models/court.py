"""
SQLAlchemy ORM model for the `courts` table.

Why this file exists:
- The club plays at multiple badminton courts around Hyderabad. Storing
  them as rows (rather than hardcoding in the frontend) lets the admin
  add/update/retire courts without a code deployment.
"""

from decimal import Decimal

from sqlalchemy import Boolean, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Court(Base):
    __tablename__ = "courts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)

    # Price per hour of court time, used as a default when creating an
    # expense for a session (the admin can still override the actual bill).
    price_per_hour: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # Free-text description of opening hours, e.g. "6 AM - 11 PM daily".
    # Kept simple for v1; could become a structured schedule table later.
    available_timings: Mapped[str] = mapped_column(String(255), nullable=True)

    contact_number: Mapped[str | None] = mapped_column(String(15), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    playing_sessions: Mapped[list["PlayingSession"]] = relationship(back_populates="court")

    def __repr__(self) -> str:
        return f"<Court id={self.id} name={self.name!r}>"
