"""HTTP routes for in-app notifications."""

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentMemberDep, NotificationServiceDep
from app.schemas.notification import NotificationRead

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationRead])
def list_my_notifications(service: NotificationServiceDep, current_member: CurrentMemberDep):
    return service.list_for_member(current_member.id)


@router.post("/{notification_id}/read", response_model=NotificationRead)
def mark_notification_read(notification_id: int, service: NotificationServiceDep, _: CurrentMemberDep):
    notification = service.mark_read(notification_id)
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return notification
