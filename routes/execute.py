# routes/execute.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.execute import ExecuteRequest, ExecuteOut
from controllers import execute_controller

router = APIRouter(prefix="/execute", tags=["Execute"])

@router.post("/", response_model=ExecuteOut)
def execute_command(data: ExecuteRequest, db: Session = Depends(get_db)):
    result = execute_controller.run_command(
        router_id=data.router_id,
        command_id=data.command_id,
        user_id=data.user_id, 
        db=db
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result