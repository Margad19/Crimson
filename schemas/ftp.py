from pydantic import BaseModel
from datetime import datetime

class FTPCreate(BaseModel):
    name: str
    host: str
    username: str | None = None 
    password: str | None = None 
    directory: str | None = None

class FTPOut(BaseModel):
    id: int
    name: str
    host: str
    username: str | None = None 
    directory: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True