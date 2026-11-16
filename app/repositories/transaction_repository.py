"""Repository layer for the `transactions` table."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import TransactionStatus, TransactionType
from app.models.transaction import Transaction


class TransactionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, transaction_id: int) -> Transaction | None:
        return self.db.get(Transaction, transaction_id)

    def get_by_provider_reference(self, provider_reference: str) -> Transaction | None:
        stmt = select(Transaction).where(Transaction.provider_reference == provider_reference)
        return self.db.execute(stmt).scalar_one_or_none()

    def list_for_member(self, member_id: int) -> list[Transaction]:
        stmt = (
            select(Transaction)
            .where(Transaction.member_id == member_id)
            .order_by(Transaction.created_at.desc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def list_all(
        self,
        *,
        status: TransactionStatus | None = None,
        transaction_type: TransactionType | None = None,
    ) -> list[Transaction]:
        """Admin-only view across every member — powers the Payments dashboard."""
        stmt = select(Transaction).order_by(Transaction.created_at.desc())
        if status is not None:
            stmt = stmt.where(Transaction.status == status)
        if transaction_type is not None:
            stmt = stmt.where(Transaction.type == transaction_type)
        return list(self.db.execute(stmt).scalars().all())

    def create(self, **fields) -> Transaction:
        transaction = Transaction(**fields)
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        return transaction

    def update_status(self, transaction: Transaction, status: TransactionStatus) -> Transaction:
        transaction.status = status
        self.db.commit()
        self.db.refresh(transaction)
        return transaction
