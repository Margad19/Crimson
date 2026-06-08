# models/coverage_zone.py
from sqlalchemy import Column, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB
from geoalchemy2 import Geometry
from database import Base


class CoverageZone(Base):
    __tablename__ = "coverage_zones"
    __table_args__ = {"schema": "public"}

    id      = Column(Integer, primary_key=True)
    name    = Column(Text)
    area    = Column(Geometry("POLYGON", srid=4326))
    details = Column(JSONB)