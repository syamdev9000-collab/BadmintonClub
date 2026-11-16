"""
Service layer for expenses and splitting bills among members.

Why this file exists:
- Implements the business rule: "The admin can enter the total bill
  amount and split it equally among participating members. Each
  member's share should be calculated automatically," and "Expense
  splitting should be based on the members who participated in that
  particular session."
"""

from datetime import date
from decimal import ROUND_HALF_UP, Decimal

from app.exceptions import ExpenseNotFoundError, NoParticipantsError, NotAnAdminError
from app.models.enums import MemberRole
from app.models.expense import Expense
from app.models.member import Member
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.playing_session_repository import PlayingSessionRepository
from app.schemas.expense import ExpenseCreate

CENT = Decimal("0.01")


class ExpenseService:
    def __init__(
        self,
        repository: ExpenseRepository,
        session_repository: PlayingSessionRepository,
    ):
        self.repository = repository
        self.session_repository = session_repository

    def get_expense(self, expense_id: int) -> Expense:
        expense = self.repository.get_by_id(expense_id)
        if expense is None:
            raise ExpenseNotFoundError(expense_id)
        return expense

    def list_expenses(
        self, *, start_date: date | None = None, end_date: date | None = None
    ) -> list[Expense]:
        return self.repository.list_all(start_date=start_date, end_date=end_date)

    def list_shares_for_member(self, member_id: int):
        return self.repository.list_shares_for_member(member_id)

    def create_expense(self, data: ExpenseCreate, *, acting_admin: Member) -> Expense:
        if acting_admin.role != MemberRole.ADMIN:
            raise NotAnAdminError()

        member_ids = data.member_ids
        if not member_ids and data.session_id is not None:
            # Default to the session's participants — the core business
            # rule for how splitting should work.
            member_ids = self.session_repository.get_participant_ids(data.session_id)

        if not member_ids:
            raise NoParticipantsError()

        share_amounts = self._split_equally(data.total_amount, member_ids)

        return self.repository.create_with_shares(
            description=data.description,
            total_amount=data.total_amount,
            session_id=data.session_id,
            created_by_id=acting_admin.id,
            share_amounts=share_amounts,
        )

    @staticmethod
    def _split_equally(total_amount: Decimal, member_ids: list[int]) -> dict[int, Decimal]:
        """
        Splits `total_amount` evenly across `member_ids`. Any leftover
        paisa from rounding (since money can't be split into infinitely
        precise fractions) is assigned to the first member, so the sum
        of shares always exactly equals total_amount.
        """
        count = len(member_ids)
        base_share = (total_amount / count).quantize(CENT, rounding=ROUND_HALF_UP)

        shares = {member_id: base_share for member_id in member_ids}
        remainder = total_amount - (base_share * count)
        if remainder != 0:
            first_member_id = member_ids[0]
            shares[first_member_id] = shares[first_member_id] + remainder

        return shares
