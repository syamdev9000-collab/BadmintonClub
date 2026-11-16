"""
Pydantic schemas (v2) for members — the shape of data going in/out of the API.

Why multiple classes instead of one?
- MemberCreate:  what the ADMIN sends to register a new member.
- MemberRead:    what we SEND BACK to clients (never includes password hash).
- MemberUpdate:  what an admin may send to partially update a member.
- DepositInfo:   a focused view of just balance + minimum-deposit status,
                 used by the member-facing "my balance" screen.
"""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import MemberRole
from app.models.member import MINIMUM_DEPOSIT


class MemberBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    mobile_number: str = Field(min_length=10, max_length=15)
    email: str | None = None


class MemberCreate(MemberBase):
    """
    Shape of data an ADMIN sends to POST /members (registration).
    Regular members never self-register — business rule: only admins can
    register new members.
    """

    role: MemberRole = MemberRole.MEMBER


class MemberUpdate(BaseModel):
    """Partial update — admin only. All fields optional."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    email: str | None = None
    is_active: bool | None = None


class MemberRead(MemberBase):
    id: int
    role: MemberRole
    registration_date: datetime
    deposit_balance: Decimal
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class DepositInfo(BaseModel):
    """Focused view for the member-facing 'my balance' screen."""

    deposit_balance: Decimal
    minimum_required: Decimal = MINIMUM_DEPOSIT
    is_below_minimum: bool

    model_config = ConfigDict(from_attributes=True)
