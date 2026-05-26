# routes/backup.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.backup import BackupRequest, BackupOut
from controllers import backup_controller
from dependencies.auth import get_current_user  # ← add
from models.user import User                    # ← add

router = APIRouter(
    prefix="/backup",
    tags=["Backup"],
    dependencies=[Depends(get_current_user)],   # ← add
)

@router.post("/", response_model=BackupOut)
def backup_router(
    data: BackupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # ← add
):
    result = backup_controller.run_backup(
        router_id=data.router_id,
        ftp_id=data.ftp_id,
        user_id=current_user.id,  # ← fix, remove user_id from BackupRequest
        db=db
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result