# routes/terminal.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from database import SessionLocal
from models.router import Router
from models.device import Device
from models.user import User
from netmiko import ConnectHandler
from jose import jwt, JWTError
import os

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
ALGORITHM = "HS256"

router = APIRouter(prefix="/terminal", tags=["Terminal"])

def verify_token(token: str, db) -> User | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        return db.query(User).filter(User.id == int(user_id)).first()
    except JWTError:
        return None

@router.websocket("/{router_id}")
async def terminal(
    websocket: WebSocket,
    router_id: int,
    token: str = Query(...),  # ← token from query param
):
    await websocket.accept()

    db = SessionLocal()
    connection = None

    try:
        # 0. Verify token
        user = verify_token(token, db)
        if not user:
            await websocket.send_text("ERROR: Unauthorized")
            await websocket.close()
            return

        # rest stays exactly the same
        router = db.query(Router).filter(Router.id == router_id).first()
        if not router:
            await websocket.send_text("ERROR: Router not found")
            await websocket.close()
            return

        device = db.query(Device).filter(Device.id == router.device_id).first()
        if not device:
            await websocket.send_text("ERROR: Device not found")
            await websocket.close()
            return

        connection_params = {
            "device_type": device.netmiko_type,
            "host":        router.host,
            "username":    router.username,
            "password":    router.password,
            "secret":      router.secret or "",
            "port":        router.port or (23 if router.connection_type == "telnet" else 22),
        }

        if router.connection_type == "telnet":
            connection_params["device_type"] = device.netmiko_type + "_telnet"

        await websocket.send_text(f"Connecting to {router.name}...")
        connection = ConnectHandler(**connection_params)
        connection.find_prompt()

        if router.secret:
            connection.enable()

        prompt = connection.find_prompt()
        await websocket.send_text(f"Connected. Prompt: {prompt}\n")

        while True:
            command = await websocket.receive_text()
            if command.strip().lower() in ["exit", "quit", "disconnect"]:
                await websocket.send_text("Disconnecting...")
                break
            output = connection.send_command_timing(command, delay_factor=2)
            await websocket.send_text(output)

    except WebSocketDisconnect:
        print(f"Client disconnected from router {router_id}")

    except Exception as e:
        await websocket.send_text(f"ERROR: {str(e)}")

    finally:
        if connection:
            connection.disconnect()
        db.close()