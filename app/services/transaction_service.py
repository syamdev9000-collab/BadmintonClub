"""
Service layer for transactions: deposits, expense-share payments, refunds.

Why this file exists:
- This is where money actually moves between the business concepts:
  a successful deposit transaction bumps a Member's deposit_balance
  (and may flip them to "active"); a successful expense payment reduces
  an ExpenseShare's outstanding amount and updates its status.
- Keeps `app/services/phonepe_client.py` purely about talking to PhonePe,
  and keeps this file purely about OUR business rules once a payment
  succeeds or fails.
"""

from decimal import Decimal

from app.exceptions import ExpenseShareNotFoundError, PaymentGatewayError
from app.models.enums import (
    ExpenseShareStatus,
    PaymentProvider,
    TransactionStatus,
    TransactionType,
)
from app.models.transaction import Transaction
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.transaction_repository import TransactionRepository
from app.services.member_service import MemberService
from app.services.phonepe_client import (
    PhonePeClient,
    PhonePePaymentRequest,
    new_merchant_transaction_id,
)


class TransactionService:
    def __init__(
        self,
        repository: TransactionRepository,
        expense_repository: ExpenseRepository,
        member_service: MemberService,
        phonepe_client: PhonePeClient | None = None,
    ):
        self.repository = repository
        self.expense_repository = expense_repository
        self.member_service = member_service
        self.phonepe_client = phonepe_client or PhonePeClient()

    def list_for_member(self, member_id: int) -> list[Transaction]:
        return self.repository.list_for_member(member_id)

    def list_all(
        self,
        *,
        status: TransactionStatus | None = None,
        transaction_type: TransactionType | None = None,
    ) -> list[Transaction]:
        return self.repository.list_all(status=status, transaction_type=transaction_type)

    # --- Deposits -----------------------------------------------------

    def initiate_deposit(
        self, member_id: int, amount: Decimal, provider: PaymentProvider
    ) -> tuple[Transaction, str | None]:
        """
        Creates a PENDING transaction, and — if paying via PhonePe —
        returns the redirect URL the frontend should send the member to.
        For manual/cash providers, the admin marks it SUCCESS directly
        via `confirm_deposit_manually`.
        """
        merchant_txn_id = new_merchant_transaction_id()
        transaction = self.repository.create(
            member_id=member_id,
            type=TransactionType.DEPOSIT,
            amount=amount,
            status=TransactionStatus.PENDING,
            provider=provider,
            provider_reference=merchant_txn_id if provider == PaymentProvider.PHONEPE else None,
        )

        redirect_url = None
        if provider == PaymentProvider.PHONEPE:
            member = self.member_service.get_member(member_id)
            result = self.phonepe_client.initiate_payment(
                PhonePePaymentRequest(
                    merchant_transaction_id=merchant_txn_id,
                    amount_paise=int(amount * 100),
                    member_mobile_number=member.mobile_number,
                )
            )
            redirect_url = result.redirect_url

        return transaction, redirect_url

    def confirm_deposit_manually(self, transaction_id: int) -> Transaction:
        """Admin confirms a cash/manual UPI deposit was received."""
        transaction = self.repository.get_by_id(transaction_id)
        if transaction is None:
            raise PaymentGatewayError("Transaction not found")
        transaction = self.repository.update_status(transaction, TransactionStatus.SUCCESS)
        self.member_service.record_deposit_paid(transaction.member_id, transaction.amount)
        return transaction

    def handle_phonepe_webhook(self, merchant_transaction_id: str) -> Transaction:
        """
        Called from the /payments/phonepe/webhook route when PhonePe
        notifies us of a payment outcome. We re-verify the status
        server-side (never trust the webhook payload alone) before
        crediting any balance.
        """
        transaction = self.repository.get_by_provider_reference(merchant_transaction_id)
        if transaction is None:
            raise PaymentGatewayError(f"Unknown transaction reference {merchant_transaction_id}")

        succeeded = self.phonepe_client.verify_payment(merchant_transaction_id)
        new_status = TransactionStatus.SUCCESS if succeeded else TransactionStatus.FAILED
        transaction = self.repository.update_status(transaction, new_status)

        if succeeded:
            if transaction.type == TransactionType.DEPOSIT:
                self.member_service.record_deposit_paid(transaction.member_id, transaction.amount)
            elif transaction.type == TransactionType.EXPENSE_PAYMENT:
                self._apply_expense_payment(transaction)

        return transaction

    # --- Expense share payments ----------------------------------------

    def initiate_expense_payment(
        self, expense_share_id: int, amount: Decimal, provider: PaymentProvider
    ) -> tuple[Transaction, str | None]:
        share = self.expense_repository.get_share_by_id(expense_share_id)
        if share is None:
            raise ExpenseShareNotFoundError(expense_share_id)

        merchant_txn_id = new_merchant_transaction_id()
        transaction = self.repository.create(
            member_id=share.member_id,
            type=TransactionType.EXPENSE_PAYMENT,
            amount=amount,
            status=TransactionStatus.PENDING,
            provider=provider,
            expense_share_id=expense_share_id,
            provider_reference=merchant_txn_id if provider == PaymentProvider.PHONEPE else None,
        )

        redirect_url = None
        if provider == PaymentProvider.PHONEPE:
            member = self.member_service.get_member(share.member_id)
            result = self.phonepe_client.initiate_payment(
                PhonePePaymentRequest(
                    merchant_transaction_id=merchant_txn_id,
                    amount_paise=int(amount * 100),
                    member_mobile_number=member.mobile_number,
                )
            )
            redirect_url = result.redirect_url

        return transaction, redirect_url

    def _apply_expense_payment(self, transaction: Transaction) -> None:
        share = self.expense_repository.get_share_by_id(transaction.expense_share_id)
        if share is None:
            return
        share.amount_paid = share.amount_paid + transaction.amount
        share.status = (
            ExpenseShareStatus.PAID
            if share.amount_paid >= share.amount_due
            else ExpenseShareStatus.PARTIAL
        )
        self.expense_repository.save_share(share)

    # --- Refunds --------------------------------------------------------

    def issue_refund(self, member_id: int, amount: Decimal) -> Transaction:
        """Admin-only refund of part/all of a member's deposit balance."""
        transaction = self.repository.create(
            member_id=member_id,
            type=TransactionType.REFUND,
            amount=amount,
            status=TransactionStatus.SUCCESS,
            provider=PaymentProvider.UPI_MANUAL,
        )
        self.member_service.record_deposit_deducted(member_id, amount)
        return transaction
