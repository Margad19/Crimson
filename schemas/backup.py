# schemas/backup.py
from pydantic import BaseModel
from datetime import datetime

class BackupRequest(BaseModel):
    router_id: int
    ftp_id:    int
    user_id:   int

class BackupOut(BaseModel):
    router_name:  str
    ftp_server:   str
    filename_txt: str
    filename_dat: str
    dat_output:   str
    status:       str
    executed_at:  datetime