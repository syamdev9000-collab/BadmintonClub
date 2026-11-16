"""
OTP (One-Time Password) service for member login.

Why this file exists:
- Encapsulates "generate a code, text it, verify it later" so the Service
  layer and routes never deal with raw SMS provider APIs directly.
- `OtpSender` is a tiny abstraction: in development it just logs the code
  to the console (no SMS costs while building); in production it calls
  MSG91's API. Swapping providers later only touches this file.
"""

import random
import secrets
from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.exceptions import OtpInvalidOrExpiredError
from app.repositories.otp_repository import OtpRepository

OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 5


class OtpSender:
    """
    Swap the body of `send` to call a real provider. Kept as a separate
    class (rather than inline in OtpService) so it's trivial to mock in
    tests and to add new providers (Twilio, etc.) later.
    """

    def send(self, mobile_number: str, code: str) -> None:
        if settings.otp_provider == "msg91":
            self._send_via_msg91(mobile_number, code)
        else:
            self._send_via_console(mobile_number, code)

    def _send_via_console(self, mobile_number: str, code: str) -> None:
        # Development/mock mode: "send" by logging, so you can test the
        # full login flow locally without an SMS bill.
        print(f"[MOCK SMS] OTP for {mobile_number}: {code}")

    def _send_via_msg91(self, mobile_number: str, code: str) -> None:
        """
        Placeholder for the real MSG91 integration.

        TODO: wire this up once MSG91_AUTH_KEY / MSG91_TEMPLATE_ID are
        set in the environment. Typical call:

            import httpx
            httpx.post(
                "https://control.msg91.com/api/v5/otp",
                headers={"authkey": settings.msg91_auth_key},
                json={
                    "template_id": settings.msg91_template_id,
                    "mobile": mobile_number,
                    "otp": code,
                },
            )

        Left unimplemented (falls back to console) until credentials
        are available, so local/dev flows keep working.
        """
        print(f"[MSG91 NOT CONFIGURED - falling back to console] OTP for {mobile_number}: {code}")


class OtpService:
    def __init__(self, repository: OtpRepository, sender: OtpSender | None = None):
        self.repository = repository
        self.sender = sender or OtpSender()

    def request_otp(self, mobile_number: str) -> None:
        code = f"{random.randint(0, 10**OTP_LENGTH - 1):0{OTP_LENGTH}d}"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)
        self.repository.create(
            mobile_number=mobile_number,
            hashed_code=hash_password(code),
            expires_at=expires_at,
        )
        self.sender.send(mobile_number, code)

    def verify_otp(self, mobile_number: str, code: str) -> None:
        otp = self.repository.get_latest_valid(mobile_number)
        if otp is None or not verify_password(code, otp.hashed_code):
            raise OtpInvalidOrExpiredError()
        self.repository.mark_used(otp)
