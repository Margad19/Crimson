# models/onetime.py
from sqlalchemy import Column, Integer, Text, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from database import Base

class OneTime(Base):
    __tablename__ = "OneTime"
    __table_args__ = {"schema": "public"}

    id         = Column(Integer, primary_key=True)
    name       = Column(Text)
    router_id  = Column(Integer, ForeignKey("public.Routers.id"))
    command_id = Column(Integer, ForeignKey("public.Commands.id"))
    time       = Column(TIMESTAMP)
    created_by = Column(Integer, ForeignKey("public.Users.id"))
    created_at = Column(TIMESTAMP, server_default=func.now())