"""Repository layer for expenses and expense shares."""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.expense import Expense, ExpenseShare


class ExpenseRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, expense_id: int) -> Expense | None:
        stmt = (
            select(Expense)
            .options(selectinload(Expense.shares))
            .where(Expense.id == expense_id)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list_all(
        self, *, start_date: date | None = None, end_date: date | None = None
    ) -> list[Expense]:
        stmt = select(Expense).options(selectinload(Expense.shares)).order_by(Expense.created_at.desc())
        if start_date is not None:
            stmt = stmt.where(Expense.created_at >= datetime.combine(start_date, datetime.min.time()))
        if end_date is not None:
            stmt = stmt.where(Expense.created_at <= datetime.combine(end_date, datetime.max.time()))
        return list(self.db.execute(stmt).scalars().all())

    def create_with_shares(
        self,
        *,
        description: str,
        total_amount: Decimal,
        session_id: int | None,
        created_by_id: int,
        share_amounts: dict[int, Decimal],
    ) -> Expense:
        expense = Expense(
            description=description,
            total_amount=total_amount,
            session_id=session_id,
            created_by_id=created_by_id,
        )
        expense.shares = [
            ExpenseShare(member_id=member_id, amount_due=amount)
            for member_id, amount in share_amounts.items()
        ]
        self.db.add(expense)
        self.db.commit()
        self.db.refresh(expense)
        return expense

    def get_share_by_id(self, share_id: int) -> ExpenseShare | None:
        return self.db.get(ExpenseShare, share_id)

    def list_shares_for_member(self, member_id: int) -> list[ExpenseShare]:
        stmt = select(ExpenseShare).where(ExpenseShare.member_id == member_id)
        return list(self.db.execute(stmt).scalars().all())

    def save_share(self, share: ExpenseShare) -> ExpenseShare:
        self.db.commit()
        self.db.refresh(share)
        return share
