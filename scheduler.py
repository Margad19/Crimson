# scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from database import SessionLocal

scheduler = BackgroundScheduler()

def load_jobs():
    from models.backup import Backup
    from models.schedule import Schedule
    from models.onetime import OneTime
    from datetime import datetime

    db = SessionLocal()
    try:
        # Backup jobs
        backups = db.query(Backup).filter(Backup.is_active == True).all()
        for backup in backups:
            schedule_backup(backup)

        # Command schedule jobs
        schedules = db.query(Schedule).filter(Schedule.is_active == True).all()
        for schedule in schedules:
            from controllers.schedule_controller import schedule_job
            schedule_job(schedule)

        # OneTime jobs — only future ones
        onetimes = db.query(OneTime).filter(OneTime.time > datetime.now()).all()
        for onetime in onetimes:
            from controllers.onetime_controller import schedule_onetime
            schedule_onetime(onetime)

    finally:
        db.close()

def schedule_backup(backup):
    from controllers.backup_controller import run_backup
    from database import SessionLocal

    def run_backup_job(router_id, ftp_id, user_id):
        db = SessionLocal()
        try:
            result = run_backup(router_id=router_id, ftp_id=ftp_id, user_id=user_id, db=db)
            print(f"Backup result: {result}")
        finally:
            db.close()

    scheduler.add_job(
        func=run_backup_job,
        trigger=CronTrigger.from_crontab(backup.cron_expr),
        args=[backup.router_id, backup.ftp_id, backup.created_by],
        id=f"backup_{backup.id}",
        replace_existing=True
    )