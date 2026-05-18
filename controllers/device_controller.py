# controllers/device_controller.py
from sqlalchemy.orm import Session
from models.device import Device
from schemas.device import DeviceCreate

def get_all_devices(db: Session):
    return db.query(Device).all()

def get_device(device_id: int, db: Session):
    return db.query(Device).filter(Device.id == device_id).first()

def create_device(data: DeviceCreate, db: Session):
    device = Device(**data.model_dump())
    db.add(device)
    db.commit()
    db.refresh(device)
    return device

def delete_device(device_id: int, db: Session):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        return None
    db.delete(device)
    db.commit()
    return device