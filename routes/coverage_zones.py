# routes/coverage_zones.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.coverage_zone import CoverageZoneCreate, CoverageZoneOut
from controllers import coverage_zone_controller
from dependencies.auth import get_current_user

router = APIRouter(
    prefix="/coverage-zones",
    tags=["Coverage Zones"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/", response_model=list[CoverageZoneOut])
def list_zones(db: Session = Depends(get_db)):
    return coverage_zone_controller.get_all_zones(db)


@router.get("/{zone_id}", response_model=CoverageZoneOut)
def get_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = coverage_zone_controller.get_zone(zone_id, db)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone


@router.post("/", response_model=CoverageZoneOut, status_code=201)
def create_zone(data: CoverageZoneCreate, db: Session = Depends(get_db)):
    return coverage_zone_controller.create_zone(data, db)


@router.put("/{zone_id}", response_model=CoverageZoneOut)
def update_zone(zone_id: int, data: CoverageZoneCreate, db: Session = Depends(get_db)):
    zone = coverage_zone_controller.update_zone(zone_id, data, db)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone


@router.delete("/{zone_id}")
def delete_zone(zone_id: int, db: Session = Depends(get_db)):
    ok = coverage_zone_controller.delete_zone(zone_id, db)
    if not ok:
        raise HTTPException(status_code=404, detail="Zone not found")
    return {"deleted": zone_id}