"""Pydantic schemas for playing sessions (court bookings)."""

from datetime import date, time

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.court import CourtRead


class PlayingSessionCreate(BaseModel):
    court_id: int
    session_date: date
    start_time: time
    end_time: time
    # Members who played/participated in this session, used later for
    # splitting any expense attached to the session.
    participant_member_ids: list[int] = Field(default_factory=list)


class PlayingSessionRead(BaseModel):
    id: int
    court: CourtRead
    session_date: date
    start_time: time
    end_time: time
    participant_member_ids: list[int]

    model_config = ConfigDict(from_attributes=True)
