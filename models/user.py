# models/user.py
from sqlalchemy import Column, Integer, Text, Date, TIMESTAMP
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "Users"
    __table_args__ = {"schema": "public"}

    id             = Column(Integer, primary_key=True)
    username       = Column(Text)
    password_hash  = Column(Text)
    role           = Column(Text)
    email          = Column(Text)
    dob            = Column(Date)
    created_at     = Column(TIMESTAMP, server_default=func.now())