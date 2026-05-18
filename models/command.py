# models/command.py
from sqlalchemy import Column, Integer, Text, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Command(Base):
    __tablename__ = "Commands"
    __table_args__ = {"schema": "public"}

    id             = Column(Integer, primary_key=True)
    name           = Column(Text)
    command_text   = Column(Text)
    description    = Column(Text)
    created_by     = Column(Integer, ForeignKey("public.Users.id"))
    created_at     = Column(TIMESTAMP, server_default=func.now())
    device_id      = Column(Integer, ForeignKey("public.Devices.id"))