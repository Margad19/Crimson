# controllers/command_controller.py
from sqlalchemy.orm import Session
from models.command import Command
from schemas.command import CommandCreate

def get_all_commands(db: Session):
    return db.query(Command).all()

def create_command(data: CommandCreate, user_id: int, db: Session):
    command = Command(**data.model_dump(), created_by=user_id)
    db.add(command)
    db.commit()
    db.refresh(command)
    return command

def delete_command(command_id: int, db: Session):
    command = db.query(Command).filter(Command.id == command_id).first()
    if not command:
        return None
    db.delete(command)
    db.commit()
    return command