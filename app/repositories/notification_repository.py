"""Repository layer for notifications."""

from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from app.models.notification import Notification


class NotificationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, notification_id: int) -> Notification | None:
        return self.db.get(Notification, notification_id)

    def list_for_member(self, member_id: int) -> list[Notification]:
        # Includes both member-specific notifications and broadcasts
        # (member_id IS NULL).
        stmt = (
            select(Notification)
            .where(or_(Notification.member_id == member_id, Notification.member_id.is_(None)))
            .order_by(Notification.created_at.desc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def create(self, **fields) -> Notification:
        notification = Notification(**fields)
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def mark_read(self, notification: Notification) -> Notification:
        notification.is_read = True
        self.db.commit()
        self.db.refresh(notification)
        return notification
