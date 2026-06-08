# schemas/cable.py
from pydantic import BaseModel
from datetime import datetime
from typing import Any


class CoordPoint(BaseModel):
    longitude: float
    latitude: float


class CableSegmentCreate(BaseModel):
    name: str
    core_count: int | None = None       # 1, 4, 8, 24, 48
    cable_type: str | None = "fiber"    # 'fiber','ftp','backbone'
    coordinates: list[CoordPoint]       # ordered list of points
    details: dict[str, Any] | None = None


class CableSegmentOut(BaseModel):
    id: int
    name: str | None = None
    core_count: int | None = None
    cable_type: str | None = None
    path: str | None = None             # WKT: LINESTRING(...)
    details: dict[str, Any] | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True