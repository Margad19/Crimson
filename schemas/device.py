# schemas/device.py
from pydantic import BaseModel

class DeviceCreate(BaseModel):
    name: str
    netmiko_type: str
    backup_command: str
    backup_tftp_command: str | None = None

class DeviceOut(BaseModel):
    id: int
    name: str
    netmiko_type: str
    backup_command: str
    backup_tftp_command: str | None = None

    class Config:
        from_attributes = True