# controllers/user_controller.py
from sqlalchemy.orm import Session
from models.user import User
from schemas.user import UserCreate

def get_all_users(db: Session):
    return db.query(User).all()

def get_user(user_id: int, db: Session):
    return db.query(User).filter(User.id == user_id).first()

def create_user(data: UserCreate, db: Session):
    user = User(**data.model_dump())
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