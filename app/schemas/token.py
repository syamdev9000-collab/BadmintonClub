"""
Pydantic schema for the token returned after a successful login.

Why this exists:
- Keeps the HTTP response shape explicit and documented (shows up
  correctly in Swagger docs at /docs), separate from the User schemas.
"""

from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
