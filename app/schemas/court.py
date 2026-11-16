"""Pydantic schemas for badminton courts."""

from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CourtBase(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    location: str = Field(min_length=1, max_length=255)
    price_per_hour: Decimal = Field(gt=0)
    available_timings: str | None = None
    contact_number: str | None = None


class CourtCreate(CourtBase):
    pass


class CourtUpdate(BaseModel):
    name: str | None = None
    location: str | None = None
    price_per_hour: Decimal | None = Field(default=None, gt=0)
    available_timings: str | None = None
    contact_number: str | None = None
    is_active: bool | None = None


class CourtRead(CourtBase):
    id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
