"""
SQLAlchemy ORM model for the `transactions` table.

Why this file exists:
- Every movement of money (deposit, payment towards an expense share,
  refund) must be recorded with a status and provider reference — this
  is what the business rule "every transaction must have a proper
  history and status" requires.
- This is also the single source of truth a member's "transaction
  history" view reads from, and what the admin's financial reports are
  built on.
"""

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import PaymentProvider, TransactionStatus, TransactionType


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    member_id: Mapped[int] = mapped_column(ForeignKey("members.id"), nullable=False)

    type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType, native_enum=False, length=30), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[TransactionStatus] = mapped_column(
        Enum(TransactionStatus, native_enum=False, length=20),
        default=TransactionStatus.PENDING,
        nullable=False,
    )
    provider: Mapped[PaymentProvider] = mapped_column(
        Enum(PaymentProvider, native_enum=False, length=20),
        default=PaymentProvider.UPI_MANUAL,
        nullable=False,
    )

    # If this transaction is paying off a specific expense share (as
    # opposed to a general deposit top-up), link it here.
    expense_share_id: Mapped[int | None] = mapped_column(ForeignKey("expense_shares.id"), nullable=True)

    # The payment gateway's own transaction/merchant-order id, used to
    # reconcile webhook callbacks and look up a payment's status later.
    provider_reference: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    member: Mapped["Member"] = relationship(back_populates="transactions")

    def __repr__(self) -> str:
        return f"<Transaction id={self.id} member_id={self.member_id} type={self.type} status={self.status}>"
