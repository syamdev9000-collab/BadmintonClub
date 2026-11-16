"""Service layer for badminton courts (admin-managed reference data)."""

from app.exceptions import CourtNotFoundError, NotAnAdminError
from app.models.court import Court
from app.models.enums import MemberRole
from app.models.member import Member
from app.repositories.court_repository import CourtRepository
from app.schemas.court import CourtCreate, CourtUpdate


class CourtService:
    def __init__(self, repository: CourtRepository):
        self.repository = repository

    def get_court(self, court_id: int) -> Court:
        court = self.repository.get_by_id(court_id)
        if court is None:
            raise CourtNotFoundError(court_id)
        return court

    def list_courts(self, *, only_active: bool = False) -> list[Court]:
        return self.repository.list_all(only_active=only_active)

    def create_court(self, data: CourtCreate, *, acting_admin: Member) -> Court:
        self._require_admin(acting_admin)
        return self.repository.create(**data.model_dump())

    def update_court(self, court_id: int, data: CourtUpdate, *, acting_admin: Member) -> Court:
        self._require_admin(acting_admin)
        court = self.get_court(court_id)
        return self.repository.update(court, **data.model_dump(exclude_unset=True))

    def delete_court(self, court_id: int, *, acting_admin: Member) -> None:
        self._require_admin(acting_admin)
        court = self.get_court(court_id)
        self.repository.delete(court)

    @staticmethod
    def _require_admin(member: Member) -> None:
        if member.role != MemberRole.ADMIN:
            raise NotAnAdminError()
