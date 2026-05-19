# routes/onetime.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.onetime import OneTimeCreate, OneTimeOut
from controllers import onetime_controller

router = APIRouter(prefix="/onetime", tags=["OneTime"])

@router.get("/", response_model=list[OneTimeOut])
def list_onetimes(db: Session = Depends(get_db)):
    return onetime_controller.get_all(db)

@router.post("/", response_model=OneTimeOut)
def add_onetime(data: OneTimeCreate, db: Session = Depends(get_db)):
    return onetime_controller.create(data, db)

@router.delete("/{onetime_id}")
def remove_onetime(onetime_id: int, db: Session = Depends(get_db)):
    result = onetime_controller.delete(onetime_id, db)
    if not result:
        raise HTTPException(status_code=404, detail="OneTime job not found")
    return {"deleted": onetime_id}