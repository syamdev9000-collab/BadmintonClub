"""
SQLAlchemy ORM model for the `members` table.

Why "Member" instead of "User":
- Every person in the system (including the admin) is a club member, but
  only a few members have the ADMIN role. One table with a `role` column
  is simpler than two separate tables, and matches the business rule that
  "only admins can register/approve/remove members" (an admin is just a
  member with elevated permissions).

Two login paths, one table:
- Admins log in with mobile_number + password (hashed_password set).
- Regular members log in with mobile_number + OTP (hashed_password is
  NULL for them — they never need a password).
"""

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Enum, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import MemberRole

MINIMUM_DEPOSIT = Decimal("500.00")


class Member(Base):
    __tablename__ = "members"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    mobile_number: Mapped[str] = mapped_column(String(15), unique=True, index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)

    # Only set for admins (password login). Regular members authenticate
    # via mobile OTP and never have a password.
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)

    role: Mapped[MemberRole] = mapped_column(
        Enum(MemberRole, native_enum=False, length=20),
        default=MemberRole.MEMBER,
        nullable=False,
    )

    registration_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Running balance of the member's deposit, denominated in INR.
    # Business rule: must stay at/above MINIMUM_DEPOSIT (500) to remain
    # an "active" member — enforced in the Service layer, not here.
    deposit_balance: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)

    # Set to True only once the member has paid the joining deposit and
    # an admin has approved them.
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="member", cascade="all, delete-orphan"
    )
    expense_shares: Mapped[list["ExpenseShare"]] = relationship(
        back_populates="member", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Member id={self.id} mobile={self.mobile_number} role={self.role}>"
