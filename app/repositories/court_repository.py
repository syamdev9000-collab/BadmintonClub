"""Repository layer for the `courts` table."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.court import Court


class CourtRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, court_id: int) -> Court | None:
        return self.db.get(Court, court_id)

    def list_all(self, *, only_active: bool = False) -> list[Court]:
        stmt = select(Court)
        if only_active:
            stmt = stmt.where(Court.is_active.is_(True))
        return list(self.db.execute(stmt).scalars().all())

    def create(self, **fields) -> Court:
        court = Court(**fields)
        self.db.add(court)
        self.db.commit()
        self.db.refresh(court)
        return court

    def update(self, court: Court, **fields) -> Court:
        for key, value in fields.items():
            if value is not None:
                setattr(court, key, value)
        self.db.commit()
        self.db.refresh(court)
        return court

    def delete(self, court: Court) -> None:
        self.db.delete(court)
        self.db.commit()
