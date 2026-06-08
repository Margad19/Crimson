# models/cable.py
from sqlalchemy import Column, Integer, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB
from geoalchemy2 import Geometry
from sqlalchemy.sql import func
from database import Base


class CableSegment(Base):
    __tablename__ = "cable_segments"
    __table_args__ = {"schema": "public"}

    id         = Column(Integer, primary_key=True)
    name       = Column(Text)
    core_count = Column(Integer)   # 1, 4, 8, 24, 48
    cable_type = Column(Text)      # 'fiber','ftp','backbone'
    path       = Column(Geometry("LINESTRING", srid=4326))
    details    = Column(JSONB)
    created_at = Column(TIMESTAMP, server_default=func.now())