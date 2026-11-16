"""
Security helpers: password hashing and verification.

Why this file exists:
- We NEVER store plain-text passwords. If our database is ever leaked,
  plain-text passwords would compromise every user's account (and likely
  their accounts on other sites too, since people reuse passwords).
- bcrypt is a slow, salted hashing algorithm designed specifically for
  passwords (unlike fast hashes like SHA-256, which are bad for passwords
  because they're too easy to brute-force).
- Centralizing this here means the Service layer just calls
  `hash_password(...)` / `verify_password(...)` without knowing or caring
  which algorithm is used underneath. If we switch from bcrypt to argon2
  later, only this file changes.
"""

from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from app.core.config import settings

# CryptContext can support multiple algorithms and handles upgrading
# old hashes transparently if you ever change schemes.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# The signing algorithm for JWTs. HS256 uses a single shared secret key
# (settings.secret_key) to both sign and verify tokens — simple and fine
# for a single-backend app. (Larger systems sometimes use RS256 with
# public/private key pairs instead.)
JWT_ALGORITHM = "HS256"


def hash_password(plain_password: str) -> str:
    """Turn a plain-text password into a secure, irreversible hash."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a plain-text password against a stored hash at login time."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str) -> str:
    """
    Create a signed JWT for a given subject (we use the user's id as a string).

    What's inside the token:
    - "sub" (subject): who this token belongs to — standard JWT claim name.
    - "exp" (expiry): when the token stops being valid. We NEVER issue
      tokens that live forever — if one is leaked, it should expire.

    The token is signed with settings.secret_key. Anyone without that key
    cannot forge a valid token, and any tampering with the payload
    invalidates the signature.
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Verify a token's signature and expiry, and return its payload.
    Raises jwt.PyJWTError (or subclasses) if the token is invalid/expired —
    the caller (an API dependency) is responsible for turning that into a
    401 Unauthorized response.
    """
    return jwt.decode(token, settings.secret_key, algorithms=[JWT_ALGORITHM])
