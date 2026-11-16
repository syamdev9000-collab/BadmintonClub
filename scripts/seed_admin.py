"""
One-off script to create the very first admin account.

Why this script exists:
- Business rule: "Only admins can register new members." That's a
  chicken-and-egg problem for the very first admin — there's no admin
  yet to register them via the API. This script bootstraps that first
  account directly against the database.

Usage:
    python -m scripts.seed_admin --name "Syam" --mobile 9876543210 --password changeme123
"""

import argparse

from app.db.session import SessionLocal
from app.models.enums import MemberRole
from app.repositories.member_repository import MemberRepository
from app.services.member_service import MemberService


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the first admin account")
    parser.add_argument("--name", required=True)
    parser.add_argument("--mobile", required=True, help="Admin's mobile number")
    parser.add_argument("--password", required=True)
    parser.add_argument("--email", default=None)
    args = parser.parse_args()

    db = SessionLocal()
    try:
        repository = MemberRepository(db)
        service = MemberService(repository)

        existing = repository.get_by_mobile(args.mobile)
        if existing is not None:
            print(f"A member with mobile {args.mobile} already exists (id={existing.id}).")
            return

        admin = repository.create(
            name=args.name,
            mobile_number=args.mobile,
            email=args.email,
            role=MemberRole.ADMIN,
        )
        service.set_admin_password(admin.id, args.password)
        repository.update(admin, is_active=True)
        print(f"Created admin '{admin.name}' (id={admin.id}, mobile={admin.mobile_number}).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
