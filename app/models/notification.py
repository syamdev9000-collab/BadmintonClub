"""
SQLAlchemy ORM model for notifications.

Why this file exists:
- Covers all cases in the "Notifications" requirement: new expense added,
  payment reminders, low-deposit warnings, schedule updates.
- `member_id` is nullable so the same table can hold a broadcast
  notification (e.g. "schedule updated for Tuesday") sent to everyone,
  as well as member-specific ones (e.g. "your deposit is below Rs.500").
- This is intentionally just a persistence + read-state record. The
  actual "send" mechanism (SMS/push/in-app) is a separate concern,
  implemented in the Service layer.
"""

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import NotificationType


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # NULL means "broadcast to all active members".
    member_id: Mapped[int | None] = mapped_column(ForeignKey("members.id"), nullable=True)

    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, native_enum=False, length=30),
        default=NotificationType.GENERAL,
        nullable=False,
    )
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    member: Mapped["Member | None"] = relationship()

    def __repr__(self) -> str:
        return f"<Notification id={self.id} type={self.type} member_id={self.member_id}>"
