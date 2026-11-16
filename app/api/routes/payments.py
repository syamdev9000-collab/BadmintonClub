"""
HTTP routes for payments: deposits, expense-share payments, refunds, and
the PhonePe webhook callback.

Why deposit/expense-payment responses include a `redirect_url`:
- When paying via PhonePe, the frontend must redirect the member's
  browser to PhonePe's hosted checkout page. For manual/cash payments,
  `redirect_url` is null and the admin confirms the payment separately.
"""

from fastapi import APIRouter, HTTPException, Request, status

from app.api.deps import CurrentAdminDep, CurrentMemberDep, TransactionServiceDep
from app.exceptions import ExpenseShareNotFoundError, PaymentGatewayError
from app.models.enums import TransactionStatus, TransactionType
from app.schemas.transaction import (
    DepositCreate,
    ExpensePaymentCreate,
    RefundCreate,
    TransactionRead,
)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("", response_model=list[TransactionRead])
def list_all_transactions(
    service: TransactionServiceDep,
    _: CurrentAdminDep,
    status_filter: TransactionStatus | None = None,
    type_filter: TransactionType | None = None,
):
    """Admin-only: every transaction across every member, for the Payments dashboard."""
    return service.list_all(status=status_filter, transaction_type=type_filter)


@router.get("/me", response_model=list[TransactionRead])
def my_transaction_history(service: TransactionServiceDep, current_member: CurrentMemberDep):
    """Members can view their deposit balance and transaction history."""
    return service.list_for_member(current_member.id)


@router.post("/deposits", status_code=status.HTTP_202_ACCEPTED)
def pay_deposit(data: DepositCreate, service: TransactionServiceDep, _: CurrentMemberDep):
    """Member (or admin on their behalf) pays towards the joining deposit."""
    try:
        transaction, redirect_url = service.initiate_deposit(data.member_id, data.amount, data.provider)
    except PaymentGatewayError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e)) from e
    return {"transaction": TransactionRead.model_validate(transaction), "redirect_url": redirect_url}


@router.post("/deposits/{transaction_id}/confirm-manual", response_model=TransactionRead)
def confirm_manual_deposit(transaction_id: int, service: TransactionServiceDep, _: CurrentAdminDep):
    """Admin confirms a cash/manual UPI deposit was received in person."""
    try:
        return service.confirm_deposit_manually(transaction_id)
    except PaymentGatewayError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e


@router.post("/expenses", status_code=status.HTTP_202_ACCEPTED)
def pay_expense_share(data: ExpensePaymentCreate, service: TransactionServiceDep, _: CurrentMemberDep):
    """Members pay their pending contributions online."""
    try:
        transaction, redirect_url = service.initiate_expense_payment(
            data.expense_share_id, data.amount, data.provider
        )
    except ExpenseShareNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except PaymentGatewayError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e)) from e
    return {"transaction": TransactionRead.model_validate(transaction), "redirect_url": redirect_url}


@router.post("/refunds", response_model=TransactionRead)
def issue_refund(data: RefundCreate, service: TransactionServiceDep, _: CurrentAdminDep):
    """Admin-only: refund part/all of a member's deposit balance."""
    return service.issue_refund(data.member_id, data.amount)


@router.post("/phonepe/webhook", status_code=status.HTTP_200_OK)
async def phonepe_webhook(request: Request, service: TransactionServiceDep):
    """
    PhonePe calls this URL to notify us of a payment outcome.

    We deliberately ignore the webhook body's own "status" field and
    re-verify with PhonePe's status API server-side — never trust a
    webhook payload alone, since it could be spoofed.
    """
    body = await request.json()
    merchant_transaction_id = body.get("data", {}).get("merchantTransactionId")
    if not merchant_transaction_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing merchantTransactionId")

    try:
        service.handle_phonepe_webhook(merchant_transaction_id)
    except PaymentGatewayError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e)) from e
    return {"status": "ok"}
