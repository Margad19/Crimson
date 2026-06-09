# controllers/point_controller.py
from sqlalchemy.orm import Session
from sqlalchemy import text
from models.point import Point
from schemas.point import PointCreate


def get_all_points(db: Session) -> list[dict]:
    # Return location as WKT so Pydantic can serialize it
    rows = db.execute(
        text("""
            SELECT id, name, description, node_type,
                   ST_AsText(location) AS location,
                   details, created_at
            FROM map_nodes
            ORDER BY id
        """)
    ).mappings().all()
    return [dict(r) for r in rows]


def get_point(point_id: int, db: Session) -> dict | None:
    row = db.execute(
        text("""
            SELECT id, name, description, node_type,
                   ST_AsText(location) AS location,
                   details, created_at
            FROM map_nodes
            WHERE id = :id
        """),
        {"id": point_id},
    ).mappings().first()
    return dict(row) if row else None


def create_point(data: PointCreate, db: Session) -> dict:
    row = db.execute(
        text("""
            INSERT INTO map_nodes (name, description, node_type, location, details)
            VALUES (
                :name,
                :description,
                :node_type,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                CAST(:details AS jsonb)
            )
            RETURNING id, name, description, node_type,
                      ST_AsText(location) AS location,
                      details, created_at
        """),
        {
            "name": data.name,
            "description": data.description,
            "node_type": data.node_type,
            "lng": data.longitude,
            "lat": data.latitude,
            "details": data.details,
        },
    ).mappings().first()
    db.commit()
    return dict(row)


def update_point(point_id: int, data: PointCreate, db: Session) -> dict | None:
    row = db.execute(
        text("""
            UPDATE map_nodes
            SET name        = :name,
                description = :description,
                node_type   = :node_type,
                location    = ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                details     = CAST(:details AS jsonb)
            WHERE id = :id
            RETURNING id, name, description, node_type,
                      ST_AsText(location) AS location,
                      details, created_at
        """),
        {
            "id": point_id,
            "name": data.name,
            "description": data.description,
            "node_type": data.node_type,
            "lng": data.longitude,
            "lat": data.latitude,
            "details": data.details,
        },
    ).mappings().first()
    db.commit()
    return dict(row) if row else None


def delete_point(point_id: int, db: Session) -> bool:
    result = db.execute(
        text("DELETE FROM map_nodes WHERE id = :id"), {"id": point_id}
    )
    db.commit()
    return result.rowcount > 0