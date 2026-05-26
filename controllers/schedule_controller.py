# controllers/schedule_controller.py
from sqlalchemy.orm import Session
from models.schedule import Schedule
from schemas.schedule import ScheduleCreate
from scheduler import scheduler
from apscheduler.triggers.cron import CronTrigger
from database import SessionLocal
from controllers import execute_controller

def run_schedule_job(router_id: int, command_id: int, user_id: int):
    db = SessionLocal()
    try:
        result = execute_controller.run_command(
            router_id=router_id,
            command_id=command_id,
            user_id=user_id,
            db=db
        )
        print(f"Schedule result: {result}")
    finally:
        db.close()

def schedule_job(schedule):
    scheduler.add_job(
        func=run_schedule_job,
        trigger=CronTrigger.from_crontab(schedule.cron_expr),
        args=[schedule.router_id, schedule.command_id, schedule.created_by],
        id=f"schedule_{schedule.id}",
        replace_existing=True
    )

def get_all(db: Session):
    return db.query(Schedule).all()

def create(data: ScheduleCreate, user_id: int, db: Session):  # ← add user_id param
    schedule = Schedule(
        router_id  = data.router_id,
        command_id = data.command_id,
        cron_expr  = data.cron_expr,
        is_active  = True,
        created_by = user_id  # ← use param
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    schedule_job(schedule)

    return schedule

def toggle(schedule_id: int, db: Session):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        return None
    schedule.is_active = not schedule.is_active
    db.commit()

    if schedule.is_active:
        schedule_job(schedule)
    else:
        job_id = f"schedule_{schedule.id}"
        if scheduler.get_job(job_id):
            scheduler.remove_job(job_id)

    return schedule

def delete(schedule_id: int, db: Session):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        return None
    job_id = f"schedule_{schedule.id}"
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
    db.delete(schedule)
    db.commit()
    return schedule