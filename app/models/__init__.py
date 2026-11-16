"""
Import every ORM model here so that:
1. `Base.metadata` knows about all tables (needed for Alembic autogenerate
   and for `Base.metadata.create_all()` in local/dev setups).
2. SQLAlchemy can resolve string-based relationship() forward references
   (e.g. Mapped["Member"]) regardless of which module gets imported first.
"""

from app.models.member import Member
from app.models.court import Court
from app.models.playing_session import PlayingSession, SessionParticipant
from app.models.expense import Expense, ExpenseShare
from app.models.transaction import Transaction
from app.models.notification import Notification
from app.models.otp import OtpCode

__all__ = [
    "Member",
    "Court",
    "PlayingSession",
    "SessionParticipant",
    "Expense",
    "ExpenseShare",
    "Transaction",
    "Notification",
    "OtpCode",
]
