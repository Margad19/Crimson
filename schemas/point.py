# schemas/point.py
from pydantic import BaseModel
from datetime import datetime
from typing import Any


class PointCreate(BaseModel):
    name: str
    description: str | None = None
    node_type: str           # 'joint','building','client','site'
    longitude: float         # used to build ST_MakePoint
    latitude: float
    details: dict[str, Any] | None = None


class PointOut(BaseModel):
    id: int
    name: str
    description: str | None = None
    node_type: str | None = None
    # location returned as WKT string (use ST_AsText in query)
    location: str | None = None
    details: dict[str, Any] | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True