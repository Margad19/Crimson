# routes/schedules.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.schedule import ScheduleCreate, ScheduleOut
from controllers import schedule_controller

router = APIRouter(prefix="/schedules", tags=["Schedules"])

@router.get("/", response_model=list[ScheduleOut])
def list_schedules(db: Session = Depends(get_db)):
    return schedule_controller.get_all(db)

@router.post("/", response_model=ScheduleOut)
def add_schedule(data: ScheduleCreate, db: Session = Depends(get_db)):
    return schedule_controller.create(data, db)

@router.patch("/{schedule_id}/toggle", response_model=ScheduleOut)
def toggle_schedule(schedule_id: int, db: Session = Depends(get_db)):
    result = schedule_controller.toggle(schedule_id, db)
    if not result:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return result

@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    result = schedule_controller.delete(schedule_id, db)
    if not result:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"deleted": schedule_id}