# schemas/command.py
from pydantic import BaseModel
from datetime import datetime

class CommandCreate(BaseModel):
    name: str
    command_text: str
    description: str
    device_id: int

class CommandOut(BaseModel):
    id: int
    name: str
    command_text: str
    description: str
    created_by: int | None = None
    created_at: datetime | None = None
    device_id: int

    class Config:
        from_attributes = True