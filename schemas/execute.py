# schemas/execute.py
from pydantic import BaseModel
from datetime import datetime

class ExecuteRequest(BaseModel):
    router_id: int
    command_id: int

class ExecuteOut(BaseModel):
    router_name: str
    command_name: str
    output: str
    executed_at: datetime