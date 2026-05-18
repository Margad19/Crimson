# routes/devices.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas.device import DeviceCreate, DeviceOut
from controllers import device_controller

router = APIRouter(prefix="/devices", tags=["Devices"])

@router.get("/", response_model=list[DeviceOut])
def list_devices(db: Session = Depends(get_db)):
    return device_controller.get_all_devices(db)

@router.get("/{device_id}", response_model=DeviceOut)
def get_device(device_id: int, db: Session = Depends(get_db)):
    device = device_controller.get_device(device_id, db)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@router.post("/", response_model=DeviceOut)
def add_device(data: DeviceCreate, db: Session = Depends(get_db)):
    return device_controller.create_device(data, db)

@router.delete("/{device_id}")
def remove_device(device_id: int, db: Session = Depends(get_db)):
    device = device_controller.delete_device(device_id, db)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return {"deleted": device_id}