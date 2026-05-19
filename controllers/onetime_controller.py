# controllers/onetime_controller.py
from sqlalchemy.orm import Session
from models.onetime import OneTime
from schemas.onetime import OneTimeCreate
from scheduler import scheduler
from apscheduler.triggers.date import DateTrigger
from database import SessionLocal
from controllers import execute_controller

def run_onetime_job(onetime_id: int, router_id: int, command_id: int, user_id: int):
    db = SessionLocal()
    try:
        result = execute_controller.run_command(
            router_id=router_id,
            command_id=command_id,
            user_id=user_id,
            db=db
        )
        print(f"OneTime job {onetime_id} result: {result}")
    finally:
        db.close()

def schedule_onetime(onetime):
    scheduler.add_job(
        func=run_onetime_job,
        trigger=DateTrigger(run_date=onetime.time),   # ← runs once at exact time
        args=[onetime.id, onetime.router_id, onetime.command_id, onetime.created_by],
        id=f"onetime_{onetime.id}",
        replace_existing=True
    )

def get_all(db: Session):
    return db.query(OneTime).all()

def create(data: OneTimeCreate, db: Session):
    onetime = OneTime(
        name       = data.name,
        router_id  = data.router_id,
        command_id = data.command_id,
        time       = data.time,
        created_by = data.user_id
    )
    db.add(onetime)
    db.commit()
    db.refresh(onetime)

    schedule_onetime(onetime)    # ← register immediately

    return onetime

def delete(onetime_id: int, db: Session):
    onetime = db.query(OneTime).filter(OneTime.id == onetime_id).first()
    if not onetime:
        return None
    job_id = f"onetime_{onetime_id}"
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
    db.delete(onetime)
    db.commit()
    return onetime