# controllers/coverage_zone_controller.py
from sqlalchemy.orm import Session
from sqlalchemy import text
from schemas.coverage_zone import CoverageZoneCreate


def _to_wkt(coordinates) -> str:
    pts = list(coordinates)
    # Auto-close ring if first != last
    if (pts[0].longitude, pts[0].latitude) != (pts[-1].longitude, pts[-1].latitude):
        pts.append(pts[0])
    ring = ", ".join(f"{c.longitude} {c.latitude}" for c in pts)
    return f"POLYGON(({ring}))"


def get_all_zones(db: Session) -> list[dict]:
    rows = db.execute(
        text("""
            SELECT id, name,
                   ST_AsText(area) AS area,
                   details
            FROM coverage_zones
            ORDER BY id
        """)
    ).mappings().all()
    return [dict(r) for r in rows]


def get_zone(zone_id: int, db: Session) -> dict | None:
    row = db.execute(
        text("""
            SELECT id, name,
                   ST_AsText(area) AS area,
                   details
            FROM coverage_zones
            WHERE id = :id
        """),
        {"id": zone_id},
    ).mappings().first()
    return dict(row) if row else None


def create_zone(data: CoverageZoneCreate, db: Session) -> dict:
    wkt = _to_wkt(data.coordinates)
    row = db.execute(
        text("""
            INSERT INTO coverage_zones (name, area, details)
            VALUES (
                :name,
                ST_GeomFromText(:wkt, 4326),
                :details::jsonb
            )
            RETURNING id, name,
                      ST_AsText(area) AS area,
                      details
        """),
        {
            "name": data.name,
            "wkt": wkt,
            "details": data.details,
        },
    ).mappings().first()
    db.commit()
    return dict(row)


def update_zone(zone_id: int, data: CoverageZoneCreate, db: Session) -> dict | None:
    wkt = _to_wkt(data.coordinates)
    row = db.execute(
        text("""
            UPDATE coverage_zones
            SET name    = :name,
                area    = ST_GeomFromText(:wkt, 4326),
                details = :details::jsonb
            WHERE id = :id
            RETURNING id, name,
                      ST_AsText(area) AS area,
                      details
        """),
        {
            "id": zone_id,
            "name": data.name,
            "wkt": wkt,
            "details": data.details,
        },
    ).mappings().first()
    db.commit()
    return dict(row) if row else None


def delete_zone(zone_id: int, db: Session) -> bool:
    result = db.execute(
        text("DELETE FROM coverage_zones WHERE id = :id"),
        {"id": zone_id},
    )
    db.commit()
    return result.rowcount > 0