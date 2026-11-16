"""
SQLAlchemy ORM model for one-time-password (OTP) codes.

Why this file exists:
- Regular members log in with mobile_number + OTP instead of a password.
  We need somewhere to store "which code did we text this number, and is
  it still valid" between the `/auth/otp/request` and `/auth/otp/verify`
  calls.
- We store a HASH of the code (never the plain code) for the same reason
  we hash passwords — if the database leaked, no one should be able to
  read out valid OTPs.
- `is_used` prevents replay: once a code is verified successfully, it
  cannot be used again even if it hasn't expired yet.
"""

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class OtpCode(Base):
    __tablename__ = "otp_codes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    mobile_number: Mapped[str] = mapped_column(String(15), index=True, nullable=False)
    hashed_code: Mapped[str] = mapped_column(String(255), nullable=False)

    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    def __repr__(self) -> str:
        return f"<OtpCode mobile={self.mobile_number} used={self.is_used}>"
