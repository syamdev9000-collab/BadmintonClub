"""
Authentication routes.

Two separate login flows, both issuing the same JWT shape:
- POST /auth/admin/login  -> admin mobile_number + password (OAuth2 form,
  so Swagger's "Authorize" button works for admin testing).
- POST /auth/otp/request  -> member requests an OTP be sent to their phone.
- POST /auth/otp/verify   -> member submits the OTP and receives a token.

Why not one shared endpoint: admins and members have fundamentally
different credentials (password vs SMS code), so merging them would
make both flows harder to reason about and validate.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import MemberServiceDep, OtpServiceDep
from app.core.security import create_access_token
from app.exceptions import InvalidCredentialsError, MemberNotFoundError, OtpInvalidOrExpiredError
from app.schemas.auth import OtpRequest, OtpVerifyRequest
from app.schemas.token import Token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/admin/login", response_model=Token)
def admin_login(
    service: MemberServiceDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
):
    print("Admin login endpoint called with username:", form_data.username)
    """OAuth2 form fields `username`/`password` map to mobile_number/password."""
    try:
        admin = service.authenticate_admin(form_data.username, form_data.password)
    except InvalidCredentialsError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        ) from e

    access_token = create_access_token(subject=str(admin.id))
    return Token(access_token=access_token)


@router.post("/otp/request", status_code=status.HTTP_204_NO_CONTENT)
def request_otp(data: OtpRequest, member_service: MemberServiceDep, otp_service: OtpServiceDep):
    """
    Business rule: OTP login only works for numbers an admin already
    registered. We still return 204 either way (no response body) to
    avoid leaking which mobile numbers are/aren't registered.
    """
    try:
        member_service.get_or_create_member_for_otp_login(data.mobile_number)
    except MemberNotFoundError:
        return  # Silently succeed-looking response; no OTP actually sent.
    otp_service.request_otp(data.mobile_number)


@router.post("/otp/verify", response_model=Token)
def verify_otp(data: OtpVerifyRequest, member_service: MemberServiceDep, otp_service: OtpServiceDep):
    try:
        otp_service.verify_otp(data.mobile_number, data.code)
    except OtpInvalidOrExpiredError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)) from e

    try:
        member = member_service.get_or_create_member_for_otp_login(data.mobile_number)
    except MemberNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not registered") from e

    access_token = create_access_token(subject=str(member.id))
    return Token(access_token=access_token)
