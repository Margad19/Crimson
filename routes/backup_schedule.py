# routes/backup_schedule.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.backup_schedule import BackupScheduleCreate, BackupScheduleOut
from controllers import backup_schedule_controller

router = APIRouter(prefix="/backup-schedules", tags=["Backup Schedules"])

@router.get("/", response_model=list[BackupScheduleOut])
def list_schedules(db: Session = Depends(get_db)):
    return backup_schedule_controller.get_all(db)

@router.post("/", response_model=BackupScheduleOut)
def add_schedule(data: BackupScheduleCreate, db: Session = Depends(get_db)):
    return backup_schedule_controller.create(data, db)

@router.patch("/{backup_id}/toggle", response_model=BackupScheduleOut)
def toggle_schedule(backup_id: int, db: Session = Depends(get_db)):
    result = backup_schedule_controller.toggle(backup_id, db)
    if not result:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return result

@router.delete("/{backup_id}")
def delete_schedule(backup_id: int, db: Session = Depends(get_db)):
    result = backup_schedule_controller.delete(backup_id, db)
    if not result:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"deleted": backup_id}