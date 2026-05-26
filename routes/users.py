# routes/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.user import UserCreate, UserOut
from controllers import user_controller
from dependencies.auth import get_current_user

router = APIRouter(
    prefix="/users",
    tags=["Users"],
    dependencies=[Depends(get_current_user)],  # ← protects every route
)

@router.get("/", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    return user_controller.get_all_users(db)

@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    device = user_controller.get_user(user_id, db)
    if not device:
        raise HTTPException(status_code=404, detail="User not found")
    return device

@router.post("/", response_model=UserOut)
def add_user(data: UserCreate, db: Session = Depends(get_db)):
    return user_controller.create_user(data, db)

@router.delete("/{user_id}")
def remove_user(user_id: int, db: Session = Depends(get_db)):
    device = user_controller.delete_user(user_id, db)
    if not device:
        raise HTTPException(status_code=404, detail="User not found")
    return {"deleted": user_id}