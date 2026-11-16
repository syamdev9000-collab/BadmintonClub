"""Pydantic schemas for notifications."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import NotificationType


class NotificationRead(BaseModel):
    id: int
    member_id: int | None
    type: NotificationType
    message: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
