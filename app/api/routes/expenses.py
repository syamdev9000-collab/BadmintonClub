"""
HTTP routes for expenses (court bills, split among session participants).

After creating an expense, we fan out a "new expense added" notification
to every member who now owes a share — satisfying the business rule
"Notify members when a new expense is added."
"""

from datetime import date

from fastapi import APIRouter, HTTPException, status

from app.api.deps import (
    CurrentAdminDep,
    CurrentMemberDep,
    ExpenseServiceDep,
    NotificationServiceDep,
)
from app.exceptions import ExpenseNotFoundError, NoParticipantsError, NotAnAdminError
from app.schemas.expense import ExpenseCreate, ExpenseRead

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("", response_model=list[ExpenseRead])
def list_expenses(
    service: ExpenseServiceDep,
    _: CurrentAdminDep,
    start_date: date | None = None,
    end_date: date | None = None,
):
    """Admin-only: daily/weekly/monthly expense reports (filter by date range)."""
    return service.list_expenses(start_date=start_date, end_date=end_date)


@router.get("/me", response_model=list[ExpenseRead])
def list_my_expense_shares(service: ExpenseServiceDep, current_member: CurrentMemberDep):
    """Member-facing: which expenses have I been charged for, paid or pending?"""
    shares = service.list_shares_for_member(current_member.id)
    expense_ids = {share.expense_id for share in shares}
    return [service.get_expense(expense_id) for expense_id in expense_ids]


@router.get("/{expense_id}", response_model=ExpenseRead)
def get_expense(expense_id: int, service: ExpenseServiceDep, _: CurrentMemberDep):
    try:
        return service.get_expense(expense_id)
    except ExpenseNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e


@router.post("", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
def create_expense(
    data: ExpenseCreate,
    service: ExpenseServiceDep,
    notification_service: NotificationServiceDep,
    admin: CurrentAdminDep,
):
    """Admin-only: enter a bill and split it among selected/session members."""
    try:
        expense = service.create_expense(data, acting_admin=admin)
    except NotAnAdminError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e)) from e
    except NoParticipantsError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    for share in expense.shares:
        notification_service.notify_expense_added(share.member_id, expense.description, share.amount_due)

    return expense
