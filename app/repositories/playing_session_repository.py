"""Repository layer for playing sessions and their participants."""

from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.playing_session import PlayingSession, SessionParticipant


class PlayingSessionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, session_id: int) -> PlayingSession | None:
        return self.db.get(PlayingSession, session_id)

    def list_upcoming(self, *, from_date: date | None = None) -> list[PlayingSession]:
        stmt = select(PlayingSession).order_by(PlayingSession.session_date, PlayingSession.start_time)
        if from_date is not None:
            stmt = stmt.where(PlayingSession.session_date >= from_date)
        return list(self.db.execute(stmt).scalars().all())

    def create(
        self,
        *,
        court_id: int,
        session_date: date,
        start_time,
        end_time,
        created_by_id: int,
        participant_member_ids: list[int],
    ) -> PlayingSession:
        session = PlayingSession(
            court_id=court_id,
            session_date=session_date,
            start_time=start_time,
            end_time=end_time,
            created_by_id=created_by_id,
        )
        session.participants = [
            SessionParticipant(member_id=member_id) for member_id in participant_member_ids
        ]
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_participant_ids(self, session_id: int) -> list[int]:
        stmt = select(SessionParticipant.member_id).where(SessionParticipant.session_id == session_id)
        return list(self.db.execute(stmt).scalars().all())
