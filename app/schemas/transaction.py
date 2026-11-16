"""Pydantic schemas for transactions (deposits, expense payments, refunds)."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import PaymentProvider, TransactionStatus, TransactionType


class DepositCreate(BaseModel):
    """Admin or member initiates a deposit top-up payment."""

    member_id: int
    amount: Decimal = Field(gt=0)
    provider: PaymentProvider = PaymentProvider.PHONEPE


class ExpensePaymentCreate(BaseModel):
    """Member pays off a pending expense share."""

    expense_share_id: int
    amount: Decimal = Field(gt=0)
    provider: PaymentProvider = PaymentProvider.PHONEPE


class RefundCreate(BaseModel):
    """Admin issues a deposit refund to a member (e.g. on exit)."""

    member_id: int
    amount: Decimal = Field(gt=0)


class TransactionRead(BaseModel):
    id: int
    member_id: int
    type: TransactionType
    amount: Decimal
    status: TransactionStatus
    provider: PaymentProvider
    expense_share_id: int | None
    provider_reference: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
