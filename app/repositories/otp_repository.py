"""Repository layer for OTP codes."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.otp import OtpCode


class OtpRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, *, mobile_number: str, hashed_code: str, expires_at: datetime) -> OtpCode:
        otp = OtpCode(mobile_number=mobile_number, hashed_code=hashed_code, expires_at=expires_at)
        self.db.add(otp)
        self.db.commit()
        self.db.refresh(otp)
        return otp

    def get_latest_valid(self, mobile_number: str) -> OtpCode | None:
        """Most recent, unused, not-yet-expired code for this mobile number."""
        stmt = (
            select(OtpCode)
            .where(
                OtpCode.mobile_number == mobile_number,
                OtpCode.is_used.is_(False),
                OtpCode.expires_at >= datetime.now(timezone.utc),
            )
            .order_by(OtpCode.created_at.desc())
        )
        return self.db.execute(stmt).scalars().first()

    def mark_used(self, otp: OtpCode) -> OtpCode:
        otp.is_used = True
        self.db.commit()
        self.db.refresh(otp)
        return otp
