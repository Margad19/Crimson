# controllers/auth_controller.py
from sqlalchemy.orm import Session
from models.user import User
from datetime import datetime, timedelta
from jose import jwt
import os

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
ALGORITHM = "HS256"
EXPIRE_MINUTES = 60 * 8  # 8 hours

def login(username: str, password: str, db: Session):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    # TODO: replace with bcrypt.verify once passwords are hashed
    if user.password_hash != password:
        return None
    payload = {
        "sub": str(user.id),
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES),
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "role": user.role, "user_id": user.id}