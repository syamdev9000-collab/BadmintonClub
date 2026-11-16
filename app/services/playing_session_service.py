"""Service layer for playing sessions (court bookings + participants)."""

from datetime import date

from app.exceptions import NotAnAdminError, PlayingSessionNotFoundError
from app.models.enums import MemberRole
from app.models.member import Member
from app.models.playing_session import PlayingSession
from app.repositories.playing_session_repository import PlayingSessionRepository
from app.schemas.playing_session import PlayingSessionCreate


class PlayingSessionService:
    def __init__(self, repository: PlayingSessionRepository):
        self.repository = repository

    def get_session(self, session_id: int) -> PlayingSession:
        session = self.repository.get_by_id(session_id)
        if session is None:
            raise PlayingSessionNotFoundError(session_id)
        return session

    def list_upcoming(self, *, from_date: date | None = None) -> list[PlayingSession]:
        return self.repository.list_upcoming(from_date=from_date)

    def create_session(self, data: PlayingSessionCreate, *, acting_admin: Member) -> PlayingSession:
        if acting_admin.role != MemberRole.ADMIN:
            raise NotAnAdminError()
        return self.repository.create(
            court_id=data.court_id,
            session_date=data.session_date,
            start_time=data.start_time,
            end_time=data.end_time,
            created_by_id=acting_admin.id,
            participant_member_ids=data.participant_member_ids,
        )

    def get_participant_ids(self, session_id: int) -> list[int]:
        return self.repository.get_participant_ids(session_id)
