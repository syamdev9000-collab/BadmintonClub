"""
Shared FastAPI dependencies — this is where Dependency Injection is wired up.

Why this file exists:
- FastAPI's `Depends()` mechanism lets a route function declare "I need a
  MemberService" without knowing how to construct one. This file is the
  ONLY place that knows the construction chain:

      get_db() -> Session
      Session -> XRepository
      XRepository -> XService

- Why does this matter? If you want to unit test a route, you can override
  a dependency in FastAPI's dependency_overrides to inject a fake service
  — no real database needed.
"""

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.exceptions import NotAnAdminError
from app.models.enums import MemberRole
from app.models.member import Member
from app.repositories.court_repository import CourtRepository
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.member_repository import MemberRepository
from app.repositories.notification_repository import NotificationRepository
from app.repositories.otp_repository import OtpRepository
from app.repositories.playing_session_repository import PlayingSessionRepository
from app.repositories.transaction_repository import TransactionRepository
from app.services.court_service import CourtService
from app.services.expense_service import ExpenseService
from app.services.member_service import MemberService
from app.services.notification_service import NotificationService
from app.services.otp_service import OtpService
from app.services.playing_session_service import PlayingSessionService
from app.services.transaction_service import TransactionService

# Annotated DB session dependency — reused across the app.
DbSession = Annotated[Session, Depends(get_db)]


# --- Service factories -------------------------------------------------


def get_member_service(db: DbSession) -> MemberService:
    return MemberService(MemberRepository(db))


MemberServiceDep = Annotated[MemberService, Depends(get_member_service)]


def get_otp_service(db: DbSession) -> OtpService:
    return OtpService(OtpRepository(db))


OtpServiceDep = Annotated[OtpService, Depends(get_otp_service)]


def get_court_service(db: DbSession) -> CourtService:
    return CourtService(CourtRepository(db))


CourtServiceDep = Annotated[CourtService, Depends(get_court_service)]


def get_playing_session_service(db: DbSession) -> PlayingSessionService:
    return PlayingSessionService(PlayingSessionRepository(db))


PlayingSessionServiceDep = Annotated[PlayingSessionService, Depends(get_playing_session_service)]


def get_expense_service(db: DbSession) -> ExpenseService:
    return ExpenseService(ExpenseRepository(db), PlayingSessionRepository(db))


ExpenseServiceDep = Annotated[ExpenseService, Depends(get_expense_service)]


def get_notification_service(db: DbSession) -> NotificationService:
    return NotificationService(NotificationRepository(db))


NotificationServiceDep = Annotated[NotificationService, Depends(get_notification_service)]


def get_transaction_service(db: DbSession, member_service: MemberServiceDep) -> TransactionService:
    return TransactionService(
        TransactionRepository(db),
        ExpenseRepository(db),
        member_service,
    )


TransactionServiceDep = Annotated[TransactionService, Depends(get_transaction_service)]


# --- Auth ---------------------------------------------------------------

# Tells FastAPI's docs (/docs) that this API uses OAuth2 "password" flow,
# and where clients get a token from (tokenUrl). Admins log in with
# mobile_number + password through this flow. Members use a separate
# OTP-based flow (app/api/routes/auth.py) that issues the same kind of
# JWT at the end, so `get_current_member` works for both.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/admin/login")


def get_current_member(
    token: Annotated[str, Depends(oauth2_scheme)],
    member_service: MemberServiceDep,
) -> Member:
    """
    Dependency that protects routes requiring authentication (any role).
    """
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        member_id = payload.get("sub")
        if member_id is None:
            raise credentials_error
    except jwt.PyJWTError as e:
        raise credentials_error from e

    member = member_service.repository.get_by_id(int(member_id))
    if member is None:
        raise credentials_error
    return member


CurrentMemberDep = Annotated[Member, Depends(get_current_member)]


def get_current_admin(current_member: CurrentMemberDep) -> Member:
    """Protects admin-only routes — 403s for authenticated non-admins."""
    if current_member.role != MemberRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(NotAnAdminError()))
    return current_member


CurrentAdminDep = Annotated[Member, Depends(get_current_admin)]
