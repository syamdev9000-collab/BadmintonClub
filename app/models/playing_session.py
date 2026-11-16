"""
SQLAlchemy ORM models for playing sessions and their participants.

Why two tables (PlayingSession + SessionParticipant) instead of one:
- A session (e.g. "Tuesday 7-9 PM at Court X") has many participating
  members, and a member participates in many sessions — a classic
  many-to-many relationship, modeled with an association table.
- We attach an `Expense` to a PlayingSession later so that "split the
  bill among participants" always means "participants of THIS session",
  satisfying the business rule: "Expense splitting should be based on
  the members who participated in that particular session."
"""

from datetime import date, datetime, time

from sqlalchemy import Date, ForeignKey, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PlayingSession(Base):
    __tablename__ = "playing_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    court_id: Mapped[int] = mapped_column(ForeignKey("courts.id"), nullable=False)

    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)

    created_by_id: Mapped[int] = mapped_column(ForeignKey("members.id"), nullable=False)

    court: Mapped["Court"] = relationship(back_populates="playing_sessions")
    participants: Mapped[list["SessionParticipant"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    expenses: Mapped[list["Expense"]] = relationship(back_populates="session")

    def __repr__(self) -> str:
        return f"<PlayingSession id={self.id} court_id={self.court_id} date={self.session_date}>"


class SessionParticipant(Base):
    """Join table: which members signed up / played in a given session."""

    __tablename__ = "session_participants"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("playing_sessions.id"), nullable=False)
    member_id: Mapped[int] = mapped_column(ForeignKey("members.id"), nullable=False)

    session: Mapped["PlayingSession"] = relationship(back_populates="participants")
    member: Mapped["Member"] = relationship()
