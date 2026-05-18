# routes/commands.py
from fastapi import APIRouter, Depends, HTTPException   # ← add HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.command import CommandCreate, CommandOut
from controllers import command_controller

router = APIRouter(prefix="/commands", tags=["Commands"])

@router.get("/", response_model=list[CommandOut])
def list_commands(db: Session = Depends(get_db)):
    return command_controller.get_all_commands(db)

@router.post("/", response_model=CommandOut)
def add_command(data: CommandCreate, db: Session = Depends(get_db)):
    return command_controller.create_command(data, user_id=1, db=db)

@router.delete("/{command_id}")
def remove_command(command_id: int, db: Session = Depends(get_db)):
    result = command_controller.delete_command(command_id, db)
    if not result:                                          # ← add 404
        raise HTTPException(status_code=404, detail="Command not found")
    return {"deleted": command_id}