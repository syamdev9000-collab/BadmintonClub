"""
Shared enums used across multiple models.

Why this file exists:
- Enums like MemberRole or TransactionStatus are referenced by more than
  one model (e.g. Transaction and ExpenseShare both need a payment status).
  Keeping them in one place avoids duplicating/mismatching string values.
"""

import enum


class MemberRole(str, enum.Enum):
    ADMIN = "admin"
    MEMBER = "member"


class TransactionType(str, enum.Enum):
    DEPOSIT = "deposit"
    EXPENSE_PAYMENT = "expense_payment"
    REFUND = "refund"


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"


class PaymentProvider(str, enum.Enum):
    PHONEPE = "phonepe"
    UPI_MANUAL = "upi_manual"
    CASH = "cash"


class ExpenseShareStatus(str, enum.Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"


class NotificationType(str, enum.Enum):
    EXPENSE_ADDED = "expense_added"
    PAYMENT_REMINDER = "payment_reminder"
    LOW_DEPOSIT = "low_deposit"
    SCHEDULE_UPDATE = "schedule_update"
    GENERAL = "general"
