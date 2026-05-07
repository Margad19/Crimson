from sqlalchemy import Column, Integer, Text, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Router(Base):
    __tablename__ = "Routers"
    __table_args__ = {"schema": "public"}

    id         = Column(Integer, primary_key=True)
    name       = Column(Text)
    host       = Column(Text)
    device_id  = Column(Integer, ForeignKey("public.Devices.id"))
    username   = Column(Text)
    password   = Column(Text)
    secret     = Column(Text)
    created_by = Column(Integer, ForeignKey("public.Users.id"))
    created_at = Column(TIMESTAMP, server_default=func.now())