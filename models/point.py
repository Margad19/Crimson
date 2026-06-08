# models/point.py
from sqlalchemy import Column, Integer, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB
from geoalchemy2 import Geometry
from sqlalchemy.sql import func
from database import Base


class Point(Base):
    __tablename__ = "map_nodes"
    __table_args__ = {"schema": "public"}

    id          = Column(Integer, primary_key=True)
    name        = Column(Text)
    description = Column(Text)
    node_type   = Column(Text)   # 'joint','building','client','site'
    location    = Column(Geometry("POINT", srid=4326))
    details     = Column(JSONB)
    created_at  = Column(TIMESTAMP, server_default=func.now())