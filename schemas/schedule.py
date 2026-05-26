# schemas/schedule.py
from pydantic import BaseModel
from datetime import datetime

class ScheduleCreate(BaseModel):
    router_id:  int
    command_id: int
    cron_expr:  str
    ftp_id:     int | None = None

class ScheduleOut(BaseModel):
    id:         int
    router_id:  int
    command_id: int
    cron_expr:  str
    is_active:  bool
    created_at: datetime | None = None

    class Config:
        from_attributes = True