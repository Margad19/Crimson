# controllers/user_controller.py
from sqlalchemy.orm import Session
from models.user import User
from schemas.user import UserCreate
import bcrypt

def get_all_users(db: Session):
    return db.query(User).all()

def get_user(user_id: int, db: Session):
    return db.query(User).filter(User.id == user_id).first()

def create_user(data: UserCreate, db: Session):
    hashed = bcrypt.hashpw(data.password_hash.encode(), bcrypt.gensalt()).decode()
    dump = data.model_dump()
    dump["password_hash"] = hashed  # ← replace plaintext with hash
    user = User(**dump)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def delete_user(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    db.delete(user)
    db.commit()
    return user