# Badminton Club Management & Payment Platform

A full-stack app to manage a badminton club's members, deposits, court
bookings, daily expenses, and PhonePe/UPI payments — built for a group
playing regularly in Hyderabad.

- **Backend**: FastAPI + PostgreSQL (layered: routes -> services -> repositories -> models)
- **Frontend**: Next.js (App Router) + Tailwind CSS
- **Auth**: Admins log in with mobile number + password; members log in with mobile number + OTP
- **Payments**: PhonePe (scaffolded, needs real merchant credentials) + manual/cash confirmation

## Project layout

```
app/                   FastAPI backend
  models/               SQLAlchemy ORM models (member, court, playing_session, expense, transaction, notification, otp)
  schemas/              Pydantic request/response shapes
  repositories/         DB access only, no business logic
  services/             Business rules (deposits, expense splitting, OTP, PhonePe, notifications)
  api/routes/           HTTP endpoints
scripts/
  seed_admin.py          Bootstraps the very first admin account
frontend/               Next.js + Tailwind app
  src/app/               Pages: /login, /dashboard (admin), /member (member)
  src/lib/               API client, auth context, shared types
  src/components/        Shared UI (Card, Button, Input, DashboardShell)
```

## Backend setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

Create a PostgreSQL database and update `DATABASE_URL` in `.env` (see
`.env` for all configurable settings — OTP provider, PhonePe credentials,
JWT secret, minimum deposit amount).

Create the tables (no Alembic migration yet — this is a fresh schema):

```bash
python -c "from app.db.base import Base; from app.db.session import engine; import app.models; Base.metadata.create_all(engine)"
```

Bootstrap the first admin account (there's no "admin signup" endpoint —
only admins can register members, so the very first one is seeded directly):

```bash
python -m scripts.seed_admin --name "Your Name" --mobile 9876543210 --password changeme123
```

Run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

Docs available at `http://localhost:8000/docs`.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:3000`. Set `NEXT_PUBLIC_API_BASE_URL` in
`frontend/.env.local` if the backend isn't on `localhost:8000`.

## Status / what's scaffolded vs. what's still a placeholder

- ✅ Member registration/management, deposits, courts, playing sessions,
  expense splitting, transaction history, notifications, admin & member
  dashboards — all wired end-to-end against the backend.
- ⚠️ **PhonePe**: request/response shapes follow PhonePe's Standard
  Checkout API, but calls will fail with a clear error until real
  `PHONEPE_MERCHANT_ID` / `PHONEPE_SALT_KEY` credentials are set in `.env`.
- ⚠️ **OTP/WhatsApp**: defaults to a "console" mode that logs the OTP instead
  of sending a real WhatsApp message (safe for local development). Switch
  `OTP_PROVIDER=whatsapp` and fill in `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/
  `TWILIO_WHATSAPP_FROM` once you have a Twilio account with WhatsApp
  enabled (see `app/services/otp_service.py`).
- ⚠️ No DB migrations yet (Alembic is installed but not configured) —
  tables are created with `Base.metadata.create_all()` for now.
