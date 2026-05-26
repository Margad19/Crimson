# schemas/backup_schedule.py
from pydantic import BaseModel
from datetime import datetime

class BackupScheduleCreate(BaseModel):
    router_id: int
    ftp_id:    int
    cron_expr: str

class BackupScheduleOut(BaseModel):
    id:         int
    router_id:  int
    ftp_id:     int
    cron_expr:  str
    is_active:  bool
    created_at: datetime | None = None

    class Config:
        from_attributes = True