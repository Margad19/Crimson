# models/schedule.py
from sqlalchemy import Column, Integer, Text, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Schedule(Base):
    __tablename__ = "Schedules"
    __table_args__ = {"schema": "public"}

    id         = Column(Integer, primary_key=True)
    router_id  = Column(Integer, ForeignKey("public.Routers.id"))
    command_id = Column(Integer, ForeignKey("public.Commands.id"))
    ftp_id     = Column(Integer, ForeignKey("public.FTP.id"))
    cron_expr  = Column(Text)
    is_active  = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("public.Users.id"))
    created_at = Column(TIMESTAMP, server_default=func.now())