# routes/ftp.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.ftp import FTPCreate, FTPOut
from controllers import ftp_controller

router = APIRouter(prefix="/ftp", tags=["FTP"])

@router.get("/", response_model=list[FTPOut])
def list_ftp(db: Session = Depends(get_db)):
    return ftp_controller.get_all_ftp(db)

@router.post("/", response_model=FTPOut)
def add_ftp(data: FTPCreate, db: Session = Depends(get_db)):
    return ftp_controller.create_ftp(data, db)

@router.delete("/{ftp_id}")
def remove_ftp(ftp_id: int, db: Session = Depends(get_db)):
    ftp = ftp_controller.delete_ftp(ftp_id, db)
    if not ftp:
        raise HTTPException(status_code=404, detail="FTP not found")
    return {"deleted": ftp_id}