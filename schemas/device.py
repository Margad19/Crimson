# schemas/device.py
from pydantic import BaseModel

class DeviceCreate(BaseModel):
    name: str
    netmiko_type: str
    backup_command: str

class DeviceOut(BaseModel):
    id: int
    name: str
    netmiko_type: str
    backup_command: str

    class Config:
        from_attributes = True