# models/device.py
from sqlalchemy import Column, Integer, Text
from database import Base

class Device(Base):
    __tablename__ = "Devices"
    __table_args__ = {"schema": "public"}

    id                  = Column(Integer, primary_key=True)
    name                = Column(Text)
    netmiko_type        = Column(Text)
    backup_command      = Column(Text)           # show running-config → .txt
    backup_tftp_command = Column(Text)           # ← add → .dat to TFTP