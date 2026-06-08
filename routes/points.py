# routes/points.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.point import PointCreate, PointOut
from controllers import point_controller
from dependencies.auth import get_current_user

router = APIRouter(
    prefix="/points",
    tags=["Map Nodes"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/", response_model=list[PointOut])
def list_points(db: Session = Depends(get_db)):
    return point_controller.get_all_points(db)


@router.get("/{point_id}", response_model=PointOut)
def get_point(point_id: int, db: Session = Depends(get_db)):
    point = point_controller.get_point(point_id, db)
    if not point:
        raise HTTPException(status_code=404, detail="Point not found")
    return point


@router.post("/", response_model=PointOut, status_code=201)
def create_point(data: PointCreate, db: Session = Depends(get_db)):
    return point_controller.create_point(data, db)


@router.put("/{point_id}", response_model=PointOut)
def update_point(point_id: int, data: PointCreate, db: Session = Depends(get_db)):
    point = point_controller.update_point(point_id, data, db)
    if not point:
        raise HTTPException(status_code=404, detail="Point not found")
    return point


@router.delete("/{point_id}")
def delete_point(point_id: int, db: Session = Depends(get_db)):
    ok = point_controller.delete_point(point_id, db)
    if not ok:
        raise HTTPException(status_code=404, detail="Point not found")
    return {"deleted": point_id}