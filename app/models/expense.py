"""
SQLAlchemy ORM models for expenses and per-member expense shares.

Why two tables (Expense + ExpenseShare):
- `Expense` is the single bill the admin enters (e.g. "Court bill for
  Tuesday session, Rs. 1200").
- `ExpenseShare` is each participating member's slice of that bill
  (amount_due) plus how much of it they've actually paid so far
  (amount_paid) and a derived status (pending/partial/paid).
- Splitting this into two tables — rather than one row per expense —
  is what lets us answer "who has paid and who has pending payments"
  (a core Admin Dashboard requirement) with a simple query.
"""

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ExpenseShareStatus


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Nullable: an expense can optionally be tied to a specific playing
    # session (so shares are split among that session's participants),
    # or be a general club expense split among manually-selected members.
    session_id: Mapped[int | None] = mapped_column(ForeignKey("playing_sessions.id"), nullable=True)

    description: Mapped[str] = mapped_column(String(255), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    created_by_id: Mapped[int] = mapped_column(ForeignKey("members.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    session: Mapped["PlayingSession | None"] = relationship(back_populates="expenses")
    shares: Mapped[list["ExpenseShare"]] = relationship(
        back_populates="expense", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Expense id={self.id} total={self.total_amount}>"


class ExpenseShare(Base):
    __tablename__ = "expense_shares"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    expense_id: Mapped[int] = mapped_column(ForeignKey("expenses.id"), nullable=False)
    member_id: Mapped[int] = mapped_column(ForeignKey("members.id"), nullable=False)

    amount_due: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    amount_paid: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)

    status: Mapped[ExpenseShareStatus] = mapped_column(
        Enum(ExpenseShareStatus, native_enum=False, length=20),
        default=ExpenseShareStatus.PENDING,
        nullable=False,
    )

    expense: Mapped["Expense"] = relationship(back_populates="shares")
    member: Mapped["Member"] = relationship(back_populates="expense_shares")

    def __repr__(self) -> str:
        return f"<ExpenseShare expense_id={self.expense_id} member_id={self.member_id} status={self.status}>"
