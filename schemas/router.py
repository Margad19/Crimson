from pydantic import BaseModel

class RouterCreate(BaseModel):
    name: str
    host: str
    device_id: int
    username: str
    password: str
    secret: str | None = None

class RouterOut(BaseModel):
    id: int
    name: str
    host: str
    device_id: int

    class Config:
        from_attributes = True