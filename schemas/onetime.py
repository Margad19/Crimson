# schemas/onetime.py
from pydantic import BaseModel
from datetime import datetime

class OneTimeCreate(BaseModel):
    name:       str
    router_id:  int
    command_id: int
    time:       datetime

class OneTimeOut(BaseModel):
    id:         int
    name:       str
    router_id:  int
    command_id: int
    time:       datetime
    created_at: datetime | None = None

    class Config:
        from_attributes = True