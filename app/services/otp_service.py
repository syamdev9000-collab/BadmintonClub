"""
OTP (One-Time Password) service for member login.

Why this file exists:
- Encapsulates "generate a code, text it, verify it later" so the Service
  layer and routes never deal with raw messaging provider APIs directly.
- `OtpSender` is a tiny abstraction: in development it just logs the code
  to the console (no messaging costs while building); in production it
  sends a real WhatsApp message via Twilio. Swapping providers later only
  touches this file.
"""

import random
import secrets
from datetime import datetime, timedelta, timezone

import httpx

from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.exceptions import OtpInvalidOrExpiredError
from app.repositories.otp_repository import OtpRepository

OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 5

TWILIO_API_BASE = "https://api.twilio.com/2010-04-01"


class OtpSender:
    """
    Swap the body of `send` to call a real provider. Kept as a separate
    class (rather than inline in OtpService) so it's trivial to mock in
    tests and to add new providers later.
    """

    def send(self, mobile_number: str, code: str) -> None:
        if settings.otp_provider == "whatsapp":
            self._send_via_whatsapp(mobile_number, code)
        else:
            self._send_via_console(mobile_number, code)

    def _send_via_console(self, mobile_number: str, code: str) -> None:
        # Development/mock mode: "send" by logging, so you can test the
        # full login flow locally without a messaging bill.
        print(f"[MOCK WHATSAPP] OTP for {mobile_number}: {code}")

    def _send_via_whatsapp(self, mobile_number: str, code: str) -> None:
        """
        Sends the OTP as a WhatsApp message via Twilio's WhatsApp API.

        Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and
        TWILIO_WHATSAPP_FROM (e.g. "whatsapp:+14155238886") to be set.
        Falls back to console logging if not configured, so local/dev
        flows keep working without real credentials.
        """
        if not (settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_whatsapp_from):
            print(f"[TWILIO WHATSAPP NOT CONFIGURED - falling back to console] OTP for {mobile_number}: {code}")
            return

        to_number = mobile_number if mobile_number.startswith("whatsapp:") else f"whatsapp:{mobile_number}"
        url = f"{TWILIO_API_BASE}/Accounts/{settings.twilio_account_sid}/Messages.json"

        try:
            response = httpx.post(
                url,
                auth=(settings.twilio_account_sid, settings.twilio_auth_token),
                data={
                    "From": settings.twilio_whatsapp_from,
                    "To": to_number,
                    "Body": f"Your Badminton Club Manager OTP is {code}. It expires in {OTP_EXPIRY_MINUTES} minutes.",
                },
                timeout=10.0,
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            # Don't crash the login flow if the messaging provider is down;
            # log the failure so it's visible in server logs/monitoring.
            print(f"[TWILIO WHATSAPP SEND FAILED] mobile={mobile_number} error={exc}")


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
