from sqlalchemy.orm import Session
from models.router import Router
from schemas.router import RouterCreate

def get_all_routers(db: Session):
    return db.query(Router).all()

def create_router(data: RouterCreate, user_id: int, db: Session):
    router = Router(**data.model_dump(), created_by=user_id)
    db.add(router)
    db.commit()
    db.refresh(router)
    return router

def delete_router(router_id: int, db: Session):
    router = db.query(Router).filter(Router.id == router_id).first()
    if not router:
        return None
    db.delete(router)
    db.commit()
    return router