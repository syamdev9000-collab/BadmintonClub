"""
HTTP routes for members.

Why this file is intentionally "thin": routes validate input, call the
Service layer, and translate Service-layer exceptions into HTTP
responses. No business rules live here (see app/services/member_service.py).
"""

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentAdminDep, CurrentMemberDep, MemberServiceDep
from app.exceptions import (
    MemberNotFoundError,
    MobileNumberAlreadyExistsError,
    NotAnAdminError,
)
from app.schemas.member import DepositInfo, MemberCreate, MemberRead, MemberUpdate

router = APIRouter(prefix="/members", tags=["members"])


@router.get("/me", response_model=MemberRead)
def get_my_profile(current_member: CurrentMemberDep):
    """Protected route — works for both admins and regular members."""
    return current_member


@router.get("/me/deposit", response_model=DepositInfo)
def get_my_deposit(current_member: CurrentMemberDep, service: MemberServiceDep):
    return DepositInfo(
        deposit_balance=current_member.deposit_balance,
        is_below_minimum=service.is_below_minimum_deposit(current_member),
    )


@router.get("", response_model=list[MemberRead])
def list_members(service: MemberServiceDep, _: CurrentAdminDep, skip: int = 0, limit: int = 100):
    """Admin-only: list every member."""
    return service.list_members(skip=skip, limit=limit)


@router.get("/{member_id}", response_model=MemberRead)
def get_member(member_id: int, service: MemberServiceDep, _: CurrentAdminDep):
    try:
        return service.get_member(member_id)
    except MemberNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e


@router.post("", response_model=MemberRead, status_code=status.HTTP_201_CREATED)
def register_member(data: MemberCreate, service: MemberServiceDep, admin: CurrentAdminDep):
    """Admin-only: register a new member. They start inactive until they
    pay the Rs.500 joining deposit."""
    try:
        return service.register_member(data, acting_admin=admin)
    except MobileNumberAlreadyExistsError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e)) from e
    except NotAnAdminError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e)) from e


@router.patch("/{member_id}", response_model=MemberRead)
def update_member(member_id: int, data: MemberUpdate, service: MemberServiceDep, admin: CurrentAdminDep):
    try:
        return service.update_member(member_id, data, acting_admin=admin)
    except MemberNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(member_id: int, service: MemberServiceDep, admin: CurrentAdminDep):
    """Admin-only: remove a member from the club."""
    try:
        service.remove_member(member_id, acting_admin=admin)
    except MemberNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
