# controllers/ftp_controller.py
from sqlalchemy.orm import Session
from models.ftp import FTPServer
from schemas.ftp import FTPCreate
from models.user import User

def get_all_ftp(db: Session):
    return db.query(FTPServer).all()

def create_ftp(data: FTPCreate, current_user: User, db: Session):
    ftp = FTPServer(**data.model_dump(), created_by=current_user.id)
    db.add(ftp)
    db.commit()
    db.refresh(ftp)
    return ftp

def delete_ftp(ftp_id: int, db: Session):
    ftp = db.query(FTPServer).filter(FTPServer.id == ftp_id).first()
    if not ftp:
        return None
    db.delete(ftp)
    db.commit()
    return ftp