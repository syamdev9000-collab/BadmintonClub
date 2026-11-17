"""
Application entrypoint.

Why this file is small:
- `main.py`'s only job is to create the FastAPI app and wire routers
  together. All real logic lives in the layers we already built
  (routes -> services -> repositories -> models).
- This is what you point uvicorn at: `uvicorn app.main:app --reload`
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, courts, expenses, members, notifications, payments, sessions
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    description="Badminton club management: members, deposits, court bookings, "
    "expense splitting, and PhonePe/UPI payments.",
    version="0.1.0",
)

# Allows the Next.js frontend (a different origin: localhost:3000 vs
# localhost:8000) to call this API from the browser. Without this,
# browsers block the request before it even reaches our routes.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(members.router)
app.include_router(courts.router)
app.include_router(sessions.router)
app.include_router(expenses.router)
app.include_router(payments.router)
app.include_router(notifications.router)

@app.get("/")
def health_check():
    print("Health check endpoint called.")
    return {"status": "ok", "app": settings.app_name, "environment": settings.environment}
