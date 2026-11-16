"""Pydantic schemas for expenses and per-member expense shares."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ExpenseShareStatus


class ExpenseCreate(BaseModel):
    description: str = Field(min_length=1, max_length=255)
    total_amount: Decimal = Field(gt=0)
    session_id: int | None = None
    # Which members to split this bill among. If omitted and session_id
    # is set, defaults to that session's participants (business rule:
    # "splitting should be based on the members who participated").
    member_ids: list[int] = Field(default_factory=list)


class ExpenseShareRead(BaseModel):
    id: int
    member_id: int
    amount_due: Decimal
    amount_paid: Decimal
    status: ExpenseShareStatus

    model_config = ConfigDict(from_attributes=True)


class ExpenseRead(BaseModel):
    id: int
    description: str
    total_amount: Decimal
    session_id: int | None
    created_at: datetime
    shares: list[ExpenseShareRead]

    model_config = ConfigDict(from_attributes=True)
