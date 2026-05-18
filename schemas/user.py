# schemas/user.py
from pydantic import BaseModel
from datetime import datetime, date

class UserCreate(BaseModel):
    username: str
    password_hash: str
    role: str
    email: str
    dob: date

class UserOut(BaseModel):
    id: int
    username: str
    role: str
    email: str
    dob: date
    created_at: datetime | None = None
                                       

    class Config:
        from_attributes = True