"""HTTP routes for playing sessions (court bookings + schedules)."""

from datetime import date

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentAdminDep, CurrentMemberDep, PlayingSessionServiceDep
from app.exceptions import NotAnAdminError, PlayingSessionNotFoundError
from app.schemas.playing_session import PlayingSessionCreate, PlayingSessionRead

router = APIRouter(prefix="/sessions", tags=["sessions"])


def _to_read_model(session) -> PlayingSessionRead:
    return PlayingSessionRead(
        id=session.id,
        court=session.court,
        session_date=session.session_date,
        start_time=session.start_time,
        end_time=session.end_time,
        participant_member_ids=[p.member_id for p in session.participants],
    )


@router.get("", response_model=list[PlayingSessionRead])
def list_upcoming_sessions(
    service: PlayingSessionServiceDep, _: CurrentMemberDep, from_date: date | None = None
):
    """Members can view upcoming playing sessions and timings."""
    sessions = service.list_upcoming(from_date=from_date)
    return [_to_read_model(s) for s in sessions]


@router.get("/{session_id}", response_model=PlayingSessionRead)
def get_session(session_id: int, service: PlayingSessionServiceDep, _: CurrentMemberDep):
    try:
        return _to_read_model(service.get_session(session_id))
    except PlayingSessionNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e


@router.post("", response_model=PlayingSessionRead, status_code=status.HTTP_201_CREATED)
def create_session(data: PlayingSessionCreate, service: PlayingSessionServiceDep, admin: CurrentAdminDep):
    """Admin-only: schedule a new playing session and record participants."""
    try:
        session = service.create_session(data, acting_admin=admin)
    except NotAnAdminError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e)) from e
    return _to_read_model(session)
