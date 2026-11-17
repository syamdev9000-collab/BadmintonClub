"""
Application settings.

Why this file exists:
- We never hardcode secrets (DB passwords, API keys) directly in code.
- `pydantic-settings` reads values from environment variables (or a .env file)
  and validates their types for us (e.g. PORT must be an int).
- Every other file that needs a setting imports `settings` from here instead
  of calling os.getenv() everywhere. One source of truth.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- App info ---
    app_name: str = "Badminton Club Manager"
    environment: str = "development"  # development | staging | production

    # --- Database ---
    # Format: postgresql+psycopg://<user>:<password>@<host>:<port>/<dbname>
    database_url: str = (
        "postgresql+psycopg://clubadmin:clubadmin@localhost:5432/badminton_club"
    )

    # --- Security (JWT auth) ---
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 30

    # --- OTP / WhatsApp provider (member login) ---
    # "console"  = mock mode, logs the OTP instead of sending a real message.
    # "whatsapp" = real provider, sends OTP via Twilio WhatsApp API. Requires
    #              twilio_account_sid + twilio_auth_token + twilio_whatsapp_from.
    otp_provider: str = "console"
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    # Twilio WhatsApp sender number, e.g. "whatsapp:+14155238886"
    twilio_whatsapp_from: str = ""

    # --- PhonePe payment gateway ---
    # Placeholders until a real merchant account is available. See
    # app/services/payment_service.py for how these are used, and
    # https://developer.phonepe.com for the official API reference.
    phonepe_merchant_id: str = ""
    phonepe_salt_key: str = ""
    phonepe_salt_index: int = 1
    phonepe_env: str = "sandbox"  # sandbox | production
    phonepe_redirect_url: str = "http://localhost:3000/payments/callback"
    phonepe_callback_url: str = "http://localhost:8000/payments/phonepe/webhook"

    # --- Business rules ---
    minimum_deposit_amount: int = 500

    # --- CORS ---
    # Comma-separated list of origins allowed to call this API from a
    # browser (e.g. the Next.js frontend running on a different port).
    cors_allowed_origins: str = "http://localhost:3000"

    @property
    def cors_allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]

    # Tell pydantic-settings to also load from a .env file if present
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


# A single shared instance, imported everywhere else as `from app.core.config import settings`
settings = Settings()
