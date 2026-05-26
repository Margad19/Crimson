# routes/routers.py
from fastapi import APIRouter, Depends, HTTPException   # ← add HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.router import RouterCreate, RouterOut
from controllers import router_controller
from dependencies.auth import get_current_user  # ← add
from models.user import User                    # ← add

router = APIRouter(
    prefix="/routers",
    tags=["Routers"],
    dependencies=[Depends(get_current_user)],   # ← add
)

@router.get("/", response_model=list[RouterOut])
def list_routers(db: Session = Depends(get_db)):
    return router_controller.get_all_routers(db)

@router.post("/", response_model=RouterOut)
def add_router(
    data: RouterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # ← add
):
    return router_controller.create_router(data, user_id=current_user.id, db=db)

@router.delete("/{router_id}")
def remove_router(router_id: int, db: Session = Depends(get_db)):
    result = router_controller.delete_router(router_id, db)
    if not result:                                          # ← add 404
        raise HTTPException(status_code=404, detail="Router not found")
    return {"deleted": router_id}

@router.get("/status")
def router_statuses(db: Session = Depends(get_db)):
    return router_controller.get_router_statuses(db)