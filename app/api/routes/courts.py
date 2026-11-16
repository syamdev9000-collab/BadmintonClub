"""HTTP routes for badminton courts (reference data, admin-managed)."""

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CourtServiceDep, CurrentAdminDep, CurrentMemberDep
from app.exceptions import CourtNotFoundError, NotAnAdminError
from app.schemas.court import CourtCreate, CourtRead, CourtUpdate

router = APIRouter(prefix="/courts", tags=["courts"])


@router.get("", response_model=list[CourtRead])
def list_courts(service: CourtServiceDep, _: CurrentMemberDep, only_active: bool = True):
    """Any authenticated member can browse available courts."""
    return service.list_courts(only_active=only_active)


@router.get("/{court_id}", response_model=CourtRead)
def get_court(court_id: int, service: CourtServiceDep, _: CurrentMemberDep):
    try:
        return service.get_court(court_id)
    except CourtNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e


@router.post("", response_model=CourtRead, status_code=status.HTTP_201_CREATED)
def create_court(data: CourtCreate, service: CourtServiceDep, admin: CurrentAdminDep):
    try:
        return service.create_court(data, acting_admin=admin)
    except NotAnAdminError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e)) from e


@router.patch("/{court_id}", response_model=CourtRead)
def update_court(court_id: int, data: CourtUpdate, service: CourtServiceDep, admin: CurrentAdminDep):
    try:
        return service.update_court(court_id, data, acting_admin=admin)
    except CourtNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e


@router.delete("/{court_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_court(court_id: int, service: CourtServiceDep, admin: CurrentAdminDep):
    try:
        service.delete_court(court_id, acting_admin=admin)
    except CourtNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
