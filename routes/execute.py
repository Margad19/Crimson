# routes/execute.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.execute import ExecuteRequest, ExecuteOut
from controllers import execute_controller
from dependencies.auth import get_current_user  # ← add
from models.user import User                    # ← add

router = APIRouter(
    prefix="/execute",
    tags=["Execute"],
    dependencies=[Depends(get_current_user)],   # ← add
)

@router.post("/", response_model=ExecuteOut)
def execute_command(
    data: ExecuteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = execute_controller.run_command(
        router_id=data.router_id,
        command_id=data.command_id,
        user_id=current_user.id,
        db=db
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result