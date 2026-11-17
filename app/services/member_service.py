"""
Service layer — business logic for members.

Why this file exists (Separation of Concerns):
- Rules like "only admins can register new members", "a member must
  reach the Rs.500 minimum deposit before being marked active", and
  "never reveal which mobile numbers are registered" live here, not in
  the router or the repository.
"""

from decimal import Decimal

from app.core.security import hash_password, verify_password
from app.exceptions import (
    InvalidCredentialsError,
    MemberNotFoundError,
    MobileNumberAlreadyExistsError,
    NotAnAdminError,
)
from app.models.enums import MemberRole
from app.models.member import MINIMUM_DEPOSIT, Member
from app.repositories.member_repository import MemberRepository
from app.schemas.member import MemberCreate, MemberUpdate


class MemberService:
    def __init__(self, repository: MemberRepository):
        self.repository = repository

    def get_member(self, member_id: int) -> Member:
        member = self.repository.get_by_id(member_id)
        if member is None:
            raise MemberNotFoundError(member_id)
        return member

    def list_members(self, skip: int = 0, limit: int = 100) -> list[Member]:
        return self.repository.list_all(skip=skip, limit=limit)

    def register_member(self, data: MemberCreate, *, acting_admin: Member) -> Member:
        """
        Business rule: only admins can register new members.
        New members start as inactive (is_active=False) with a zero
        deposit balance — they become "active" only after paying the
        Rs.500 minimum joining deposit (see `record_deposit_paid`).
        """
        self._require_admin(acting_admin)

        existing = self.repository.get_by_mobile(data.mobile_number)
        if existing is not None:
            raise MobileNumberAlreadyExistsError(data.mobile_number)

        return self.repository.create(
            name=data.name,
            mobile_number=data.mobile_number,
            email=data.email,
            role=data.role,
        )

    def update_member(self, member_id: int, data: MemberUpdate, *, acting_admin: Member) -> Member:
        self._require_admin(acting_admin)
        member = self.get_member(member_id)
        return self.repository.update(
            member, name=data.name, email=data.email, is_active=data.is_active
        )

    def remove_member(self, member_id: int, *, acting_admin: Member) -> None:
        self._require_admin(acting_admin)
        member = self.get_member(member_id)
        self.repository.delete(member)

    def record_deposit_paid(self, member_id: int, amount: Decimal) -> Member:
        """
        Called by the payment/transaction service once a deposit payment
        succeeds. Bumps the balance and flips `is_active` to True the
        moment the balance reaches the Rs.500 minimum.
        """
        member = self.get_member(member_id)
        member = self.repository.adjust_deposit_balance(member, amount)
        if member.deposit_balance >= MINIMUM_DEPOSIT and not member.is_active:
            member = self.repository.update(member, is_active=True)
        return member

    def record_deposit_deducted(self, member_id: int, amount: Decimal) -> Member:
        """Used for refunds or deducting a payment from the deposit balance."""
        member = self.get_member(member_id)
        return self.repository.adjust_deposit_balance(member, -amount)

    def is_below_minimum_deposit(self, member: Member) -> bool:
        return member.deposit_balance < MINIMUM_DEPOSIT

    def authenticate_admin(self, mobile_number: str, password: str) -> Member:
        """
        Admin login: mobile_number + password.
        Same error for "no such member"/"wrong password"/"not an admin"
        to avoid leaking which mobile numbers are registered.
        """
        member = self.repository.get_by_mobile(mobile_number)
        if (
            member is None
            or member.role != MemberRole.ADMIN
            or member.hashed_password is None
            or not verify_password(password, member.hashed_password)
        ):
            raise InvalidCredentialsError()
        return member

    def set_admin_password(self, member_id: int, plain_password: str) -> Member:
        """Used when provisioning the first admin account (see seed script)."""
        member = self.get_member(member_id)
        return self.repository.update(member, hashed_password=hash_password(plain_password))

    def get_or_create_member_for_otp_login(self, mobile_number: str) -> Member:
        """
        OTP login only works for numbers an admin has already registered
        — business rule: "only admins can register new members". If the
        number isn't registered yet, callers should treat this as "no
        such member" rather than silently creating one.
        """
        member = self.repository.get_by_mobile(mobile_number)
        print(f"get_or_create_member_for_otp_login called with mobile_number: {mobile_number}, found member: {member}")
        if member is None:
            raise MemberNotFoundError(0)
        return member

    @staticmethod
    def _require_admin(member: Member) -> None:
        if member.role != MemberRole.ADMIN:
            raise NotAnAdminError()
