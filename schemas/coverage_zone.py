# schemas/coverage_zone.py
from pydantic import BaseModel, model_validator
from typing import Any


class CoordPoint(BaseModel):
    longitude: float
    latitude: float


class CoverageZoneCreate(BaseModel):
    name: str
    # Ring of points — first and last are auto-closed if not identical
    coordinates: list[CoordPoint]
    details: dict[str, Any] | None = None

    @model_validator(mode="after")
    def check_min_points(self):
        if len(self.coordinates) < 3:
            raise ValueError("Polygon needs at least 3 points")
        return self


class CoverageZoneOut(BaseModel):
    id: int
    name: str | None = None
    area: str | None = None     # WKT: POLYGON(...)
    details: dict[str, Any] | None = None

    class Config:
        from_attributes = True