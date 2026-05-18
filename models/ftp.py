# models/ftp.py
from sqlalchemy import Column, Integer, Text, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from database import Base

class FTPServer(Base):
    __tablename__ = "FTP"
    __table_args__ = {"schema": "public"}

    id         = Column(Integer, primary_key=True)
    name       = Column(Text)
    host       = Column(Text)
    username   = Column(Text)
    password   = Column(Text)
    directory  = Column(Text)
    created_by = Column(Integer, ForeignKey("public.Users.id"))
    created_at = Column(TIMESTAMP, server_default=func.now())