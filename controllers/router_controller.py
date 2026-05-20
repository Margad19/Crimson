# controllers/command_controller.py
from sqlalchemy.orm import Session
from models.router import Router
from schemas.router import RouterCreate
import socket
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

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

# ── in-memory cache ──
_status_cache: list = []
_cache_time: float = 0
CACHE_TTL: int = 60  # seconds — tune this

def _ping_one(router: Router) -> dict:
    port = router.port or (22 if router.connection_type == "ssh" else 23)
    try:
        sock = socket.create_connection((router.host, port), timeout=3)
        sock.close()
        online = True
    except (socket.timeout, socket.error):
        online = False
    return {"id": router.id, "name": router.name, "host": router.host, "online": online}

def get_router_statuses(db: Session, max_workers: int = 20) -> list:
    global _status_cache, _cache_time

    # return cache if still fresh
    if _status_cache and (time.time() - _cache_time) < CACHE_TTL:
        return _status_cache

    # cache expired — re-ping
    routers = db.query(Router).all()
    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(_ping_one, r): r for r in routers}
        for future in as_completed(futures):
            try:
                results.append(future.result())
            except Exception:
                r = futures[future]
                results.append({"id": r.id, "name": r.name, "host": r.host, "online": False})

    _status_cache = results
    _cache_time = time.time()
    return _status_cache