# routes/terminal.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from models.router import Router
from models.device import Device
from netmiko import ConnectHandler

router = APIRouter(prefix="/terminal", tags=["Terminal"])

@router.websocket("/{router_id}")
async def terminal(websocket: WebSocket, router_id: int):
    await websocket.accept()

    db = SessionLocal()
    connection = None

    try:
        # 1. Fetch router
        router = db.query(Router).filter(Router.id == router_id).first()
        if not router:
            await websocket.send_text("ERROR: Router not found")
            await websocket.close()
            return

        # 2. Fetch device
        device = db.query(Device).filter(Device.id == router.device_id).first()
        if not device:
            await websocket.send_text("ERROR: Device not found")
            await websocket.close()
            return

        # 3. Build connection
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

        # 4. Connect to router
        await websocket.send_text(f"Connecting to {router.name}...")
        connection = ConnectHandler(**connection_params)

        connection.find_prompt()

        if router.secret:
            connection.enable()

        prompt = connection.find_prompt()
        await websocket.send_text(f"Connected. Prompt: {prompt}\n")

        # 5. Loop — receive command → send to router → return output
        while True:
            command = await websocket.receive_text()   # ← wait for user input

            if command.strip().lower() in ["exit", "quit", "disconnect"]:
                await websocket.send_text("Disconnecting...")
                break

            output = connection.send_command_timing(command, delay_factor=2)
            await websocket.send_text(output)          # ← send output back

    except WebSocketDisconnect:
        print(f"Client disconnected from router {router_id}")

    except Exception as e:
        await websocket.send_text(f"ERROR: {str(e)}")

    finally:
        if connection:
            connection.disconnect()
        db.close()