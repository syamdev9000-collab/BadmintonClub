"""
Pydantic schemas for authentication requests.

Why separate from member.py:
- These describe login/OTP *request* shapes, not the Member resource
  itself. Keeping them apart avoids a circular "member needs auth, auth
  needs member" scheme file.
"""

from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    """Admins authenticate with mobile_number + password."""

    mobile_number: str = Field(min_length=10, max_length=15)
    password: str


class OtpRequest(BaseModel):
    """Step 1 of member login: ask the server to text a one-time code."""

    mobile_number: str = Field(min_length=10, max_length=15)


class OtpVerifyRequest(BaseModel):
    """Step 2 of member login: prove you received the code."""

    mobile_number: str = Field(min_length=10, max_length=15)
    code: str = Field(min_length=4, max_length=8)
