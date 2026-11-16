"""
Service layer for notifications.

Why this file exists:
- Centralizes "when do we notify, and what does the message say" so
  callers (expense service, transaction service, member service) don't
  duplicate message-formatting logic.
- `create_and_dispatch` only persists the notification for now (an
  in-app notification list). TODO: hook in an actual push/SMS channel
  here once that's prioritized — this is the single place to add it.
"""

from app.models.enums import NotificationType
from app.models.notification import Notification
from app.repositories.notification_repository import NotificationRepository


class NotificationService:
    def __init__(self, repository: NotificationRepository):
        self.repository = repository

    def list_for_member(self, member_id: int) -> list[Notification]:
        return self.repository.list_for_member(member_id)

    def mark_read(self, notification_id: int) -> Notification:
        notification = self.repository.get_by_id(notification_id)
        return self.repository.mark_read(notification)

    def notify_expense_added(self, member_id: int, description: str, amount_due) -> Notification:
        return self.repository.create(
            member_id=member_id,
            type=NotificationType.EXPENSE_ADDED,
            message=f"New expense '{description}' added. Your share: Rs.{amount_due}.",
        )

    def notify_payment_reminder(self, member_id: int, amount_due) -> Notification:
        return self.repository.create(
            member_id=member_id,
            type=NotificationType.PAYMENT_REMINDER,
            message=f"Reminder: you have a pending payment of Rs.{amount_due}.",
        )

    def notify_low_deposit(self, member_id: int, balance, minimum) -> Notification:
        return self.repository.create(
            member_id=member_id,
            type=NotificationType.LOW_DEPOSIT,
            message=f"Your deposit balance (Rs.{balance}) is below the minimum of Rs.{minimum}.",
        )

    def notify_schedule_update(self, message: str) -> Notification:
        """Broadcast to all members (member_id=None)."""
        return self.repository.create(member_id=None, type=NotificationType.SCHEDULE_UPDATE, message=message)
