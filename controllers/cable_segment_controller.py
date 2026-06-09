# controllers/cable_controller.py
from sqlalchemy.orm import Session
from sqlalchemy import text
from schemas.cable import CableSegmentCreate


def _to_wkt(coordinates) -> str:
    pts = " , ".join(f"{c.longitude} {c.latitude}" for c in coordinates)
    return f"LINESTRING({pts})"


def get_all_segments(db: Session) -> list[dict]:
    rows = db.execute(
        text("""
            SELECT id, name, core_count, cable_type,
                   ST_AsText(path) AS path,
                   details, created_at
            FROM cable_segments
            ORDER BY id
        """)
    ).mappings().all()
    return [dict(r) for r in rows]


def get_segment(segment_id: int, db: Session) -> dict | None:
    row = db.execute(
        text("""
            SELECT id, name, core_count, cable_type,
                   ST_AsText(path) AS path,
                   details, created_at
            FROM cable_segments
            WHERE id = :id
        """),
        {"id": segment_id},
    ).mappings().first()
    return dict(row) if row else None


def create_segment(data: CableSegmentCreate, db: Session) -> dict:
    wkt = _to_wkt(data.coordinates)
    row = db.execute(
        text("""
            INSERT INTO cable_segments (name, core_count, cable_type, path, details)
            VALUES (
                :name,
                :core_count,
                :cable_type,
                ST_GeomFromText(:wkt, 4326),
                CAST(:details AS jsonb)
            )
            RETURNING id, name, core_count, cable_type,
                      ST_AsText(path) AS path,
                      details, created_at
        """),
        {
            "name": data.name,
            "core_count": data.core_count,
            "cable_type": data.cable_type,
            "wkt": wkt,
            "details": data.details,
        },
    ).mappings().first()
    db.commit()
    return dict(row)


def update_segment(segment_id: int, data: CableSegmentCreate, db: Session) -> dict | None:
    wkt = _to_wkt(data.coordinates)
    row = db.execute(
        text("""
            UPDATE cable_segments
            SET name       = :name,
                core_count = :core_count,
                cable_type = :cable_type,
                path       = ST_GeomFromText(:wkt, 4326),
                details    = CAST(:details AS jsonb)
            WHERE id = :id
            RETURNING id, name, core_count, cable_type,
                      ST_AsText(path) AS path,
                      details, created_at
        """),
        {
            "id": segment_id,
            "name": data.name,
            "core_count": data.core_count,
            "cable_type": data.cable_type,
            "wkt": wkt,
            "details": data.details,
        },
    ).mappings().first()
    db.commit()
    return dict(row) if row else None


def delete_segment(segment_id: int, db: Session) -> bool:
    result = db.execute(
        text("DELETE FROM cable_segments WHERE id = :id"),
        {"id": segment_id},
    )
    db.commit()
    return result.rowcount > 0