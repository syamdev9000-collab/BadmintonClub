"""
Repository layer — the ONLY place allowed to query the `members` table.

Why this file exists (Repository Pattern):
- See app/services/member_service.py for the business rules that call
  into these methods. This file stays "dumb": plain CRUD + lookups,
  no business logic (e.g. no minimum-deposit checks here).
"""

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import MemberRole
from app.models.member import Member


class MemberRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, member_id: int) -> Member | None:
        return self.db.get(Member, member_id)

    def get_by_mobile(self, mobile_number: str) -> Member | None:
        stmt = select(Member).where(Member.mobile_number == mobile_number)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_email(self, email: str) -> Member | None:
        stmt = select(Member).where(Member.email == email)
        return self.db.execute(stmt).scalar_one_or_none()

    def list_all(self, skip: int = 0, limit: int = 100) -> list[Member]:
        stmt = select(Member).offset(skip).limit(limit)
        return list(self.db.execute(stmt).scalars().all())

    def create(
        self,
        *,
        name: str,
        mobile_number: str,
        email: str | None = None,
        role: MemberRole = MemberRole.MEMBER,
        hashed_password: str | None = None,
    ) -> Member:
        member = Member(
            name=name,
            mobile_number=mobile_number,
            email=email,
            role=role,
            hashed_password=hashed_password,
        )
        self.db.add(member)
        self.db.commit()
        self.db.refresh(member)
        return member

    def update(self, member: Member, **fields) -> Member:
        for key, value in fields.items():
            if value is not None:
                setattr(member, key, value)
        self.db.commit()
        self.db.refresh(member)
        return member

    def adjust_deposit_balance(self, member: Member, delta: Decimal) -> Member:
        """Add (or subtract, with a negative delta) from a member's deposit balance."""
        member.deposit_balance = member.deposit_balance + delta
        self.db.commit()
        self.db.refresh(member)
        return member

    def delete(self, member: Member) -> None:
        self.db.delete(member)
        self.db.commit()
