# models/backup.py
from sqlalchemy import Column, Integer, Text, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Backup(Base):
    __tablename__ = "Backup"
    __table_args__ = {"schema": "public"}

    id         = Column(Integer, primary_key=True)
    router_id  = Column(Integer, ForeignKey("public.Routers.id"))
    ftp_id     = Column(Integer, ForeignKey("public.FTP.id"))
    cron_expr  = Column(Text)
    is_active  = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("public.Users.id"))
    created_at = Column(TIMESTAMP, server_default=func.now())