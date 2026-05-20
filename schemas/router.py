# schemas/router.py
from pydantic import BaseModel
from datetime import datetime   # ← add this

class RouterCreate(BaseModel):
    name: str
    host: str
    device_id: int
    username: str
    password: str
    secret: str | None = None
    connection_type: str | None = None
    port: int | None = None

class RouterOut(BaseModel):
    id: int
    name: str
    host: str
    device_id: int
    connection_type: str | None = None
    port: int | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True