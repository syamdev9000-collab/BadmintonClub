"""
PhonePe payment gateway client — scaffold only.

Why this file exists:
- Centralizes all PhonePe-specific API details (request signing, endpoint
  URLs, payload shape) so the rest of the app only calls simple methods
  like `initiate_payment(...)` / `verify_payment(...)` without knowing
  PhonePe's wire format.
- Credentials (merchant id, salt key) are NOT set yet (see
  app/core/config.py) — calls will raise PaymentGatewayError until real
  sandbox/production credentials are configured. The request/response
  shapes below follow PhonePe's published Standard Checkout API so that
  wiring in real credentials later is a drop-in change, not a rewrite.

Reference: https://developer.phonepe.com/v1/reference/pay-api
"""

import base64
import hashlib
import json
import uuid
from dataclasses import dataclass

import httpx

from app.core.config import settings
from app.exceptions import PaymentGatewayError

_SANDBOX_BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox"
_PRODUCTION_BASE_URL = "https://api.phonepe.com/apis/hermes"


@dataclass
class PhonePePaymentRequest:
    merchant_transaction_id: str
    amount_paise: int
    member_mobile_number: str


@dataclass
class PhonePePaymentResult:
    merchant_transaction_id: str
    redirect_url: str


class PhonePeClient:
    def __init__(self):
        self.merchant_id = settings.phonepe_merchant_id
        self.salt_key = settings.phonepe_salt_key
        self.salt_index = settings.phonepe_salt_index
        self.base_url = (
            _PRODUCTION_BASE_URL if settings.phonepe_env == "production" else _SANDBOX_BASE_URL
        )

    def _require_configured(self) -> None:
        if not self.merchant_id or not self.salt_key:
            raise PaymentGatewayError(
                "PhonePe credentials are not configured yet. Set "
                "PHONEPE_MERCHANT_ID and PHONEPE_SALT_KEY in your .env "
                "once you have a merchant account."
            )

    def _sign(self, payload_b64: str, endpoint_path: str) -> str:
        to_hash = f"{payload_b64}{endpoint_path}{self.salt_key}"
        sha256 = hashlib.sha256(to_hash.encode()).hexdigest()
        return f"{sha256}###{self.salt_index}"

    def initiate_payment(self, request: PhonePePaymentRequest) -> PhonePePaymentResult:
        """
        Kick off a PhonePe payment and return the redirect URL the
        frontend should send the member to.

        TODO once credentials exist: remove `_require_configured` guard
        reliance and test end-to-end against the sandbox base URL.
        """
        self._require_configured()

        endpoint_path = "/pg/v1/pay"
        payload = {
            "merchantId": self.merchant_id,
            "merchantTransactionId": request.merchant_transaction_id,
            "merchantUserId": request.member_mobile_number,
            "amount": request.amount_paise,
            "redirectUrl": settings.phonepe_redirect_url,
            "redirectMode": "REDIRECT",
            "callbackUrl": settings.phonepe_callback_url,
            "paymentInstrument": {"type": "PAY_PAGE"},
        }
        payload_b64 = base64.b64encode(json.dumps(payload).encode()).decode()
        checksum = self._sign(payload_b64, endpoint_path)

        response = httpx.post(
            f"{self.base_url}{endpoint_path}",
            json={"request": payload_b64},
            headers={
                "Content-Type": "application/json",
                "X-VERIFY": checksum,
            },
            timeout=15.0,
        )
        if response.status_code != 200:
            raise PaymentGatewayError(f"PhonePe returned {response.status_code}: {response.text}")

        data = response.json()
        redirect_url = (
            data.get("data", {}).get("instrumentResponse", {}).get("redirectInfo", {}).get("url")
        )
        if not redirect_url:
            raise PaymentGatewayError("PhonePe response did not include a redirect URL")

        return PhonePePaymentResult(
            merchant_transaction_id=request.merchant_transaction_id,
            redirect_url=redirect_url,
        )

    def verify_payment(self, merchant_transaction_id: str) -> bool:
        """
        Poll PhonePe's status API to confirm whether a payment succeeded.
        Returns True only when PhonePe reports a successful payment.
        """
        self._require_configured()

        endpoint_path = f"/pg/v1/status/{self.merchant_id}/{merchant_transaction_id}"
        checksum = self._sign("", endpoint_path)

        response = httpx.get(
            f"{self.base_url}{endpoint_path}",
            headers={
                "Content-Type": "application/json",
                "X-VERIFY": checksum,
                "X-MERCHANT-ID": self.merchant_id,
            },
            timeout=15.0,
        )
        if response.status_code != 200:
            raise PaymentGatewayError(f"PhonePe returned {response.status_code}: {response.text}")

        data = response.json()
        return data.get("code") == "PAYMENT_SUCCESS"


def new_merchant_transaction_id() -> str:
    """A unique id PhonePe requires per payment attempt."""
    return f"club-{uuid.uuid4().hex[:20]}"
