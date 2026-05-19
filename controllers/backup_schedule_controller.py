# controllers/backup_schedule_controller.py
from sqlalchemy.orm import Session
from models.backup import Backup
from schemas.backup_schedule import BackupScheduleCreate
from scheduler import scheduler, schedule_backup

def get_all(db: Session):
    return db.query(Backup).all()

def create(data: BackupScheduleCreate, db: Session):
    backup = Backup(
        router_id  = data.router_id,
        ftp_id     = data.ftp_id,
        cron_expr  = data.cron_expr,
        is_active  = True,
        created_by = data.user_id
    )
    db.add(backup)
    db.commit()
    db.refresh(backup)

    # Add to live scheduler immediately
    schedule_backup(backup)

    return backup

def toggle(backup_id: int, db: Session):
    backup = db.query(Backup).filter(Backup.id == backup_id).first()
    if not backup:
        return None
    backup.is_active = not backup.is_active
    db.commit()

    if backup.is_active:
        schedule_backup(backup)
    else:
        job_id = f"backup_{backup.id}"
        if scheduler.get_job(job_id):
            scheduler.remove_job(job_id)

    return backup

def delete(backup_id: int, db: Session):
    backup = db.query(Backup).filter(Backup.id == backup_id).first()
    if not backup:
        return None
    job_id = f"backup_{backup.id}"
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
    db.delete(backup)
    db.commit()
    return backup