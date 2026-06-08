# routes/cable.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.cable import CableSegmentCreate, CableSegmentOut
from controllers import cable_segment_controller
from dependencies.auth import get_current_user

router = APIRouter(
    prefix="/cable-segments",
    tags=["Cable Segments"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/", response_model=list[CableSegmentOut])
def list_segments(db: Session = Depends(get_db)):
    return cable_segment_controller.get_all_segments(db)


@router.get("/{segment_id}", response_model=CableSegmentOut)
def get_segment(segment_id: int, db: Session = Depends(get_db)):
    seg = cable_segment_controller.get_segment(segment_id, db)
    if not seg:
        raise HTTPException(status_code=404, detail="Segment not found")
    return seg


@router.post("/", response_model=CableSegmentOut, status_code=201)
def create_segment(data: CableSegmentCreate, db: Session = Depends(get_db)):
    return cable_segment_controller.create_segment(data, db)


@router.put("/{segment_id}", response_model=CableSegmentOut)
def update_segment(segment_id: int, data: CableSegmentCreate, db: Session = Depends(get_db)):
    seg = cable_segment_controller.update_segment(segment_id, data, db)
    if not seg:
        raise HTTPException(status_code=404, detail="Segment not found")
    return seg


@router.delete("/{segment_id}")
def delete_segment(segment_id: int, db: Session = Depends(get_db)):
    ok = cable_segment_controller.delete_segment(segment_id, db)
    if not ok:
        raise HTTPException(status_code=404, detail="Segment not found")
    return {"deleted": segment_id}