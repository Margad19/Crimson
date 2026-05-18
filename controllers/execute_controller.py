# controllers/execute_controller.py
from sqlalchemy.orm import Session
from models.router import Router
from models.command import Command
from models.device import Device
from models.user import User
from netmiko import ConnectHandler
from datetime import datetime

def run_command(router_id: int, command_id: int, user_id: int, db: Session):

    # 0. Validate user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}

    # 1. Fetch router
    router = db.query(Router).filter(Router.id == router_id).first()
    if not router:
        return {"error": "Router not found"}

    # 2. Fetch command
    command = db.query(Command).filter(Command.id == command_id).first()
    if not command:
        return {"error": "Command not found"}

    # 3. Check device_id match
    if router.device_id != command.device_id:
        return {"error": f"Device mismatch. Router={router.device_id}, Command={command.device_id}"}

    # 4. Fetch device → get netmiko_type
    device = db.query(Device).filter(Device.id == router.device_id).first()
    if not device:
        return {"error": "Device type not found"}

    # 5. Build connection params
    connection_params = {
        "device_type": device.netmiko_type,
        "host":        router.host,
        "username":    router.username,
        "password":    router.password,
        "secret":      router.secret or "",
        "port":        router.port or (23 if router.connection_type == "telnet" else 22),
    }

    # 6. Append _telnet if needed
    if router.connection_type == "telnet":
        connection_params["device_type"] = device.netmiko_type + "_telnet"

    # 7. Connect and run
    try:
        connection = ConnectHandler(**connection_params)

        # Check prompt before enable
        prompt_before = connection.find_prompt()

        if router.secret:
            connection.enable()

        # Check prompt after enable
        prompt_after = connection.find_prompt()

        # If still > not # — enable failed
        if ">" in prompt_after:
            connection.disconnect()
            return {"error": f"Enable failed. Still in user mode: {prompt_after}"}

        if any(keyword in command.command_text for keyword in ["copy", "tftp", "backup", "upload"]):
            output = connection.send_command_timing(
                command.command_text,
                delay_factor=4
            )
        else:
            output = connection.send_command(command.command_text)

        connection.disconnect()

    except Exception as e:
        return {"error": str(e)}

    return {
        "router_name":  router.name,
        "command_name": command.name,
        "output":       output,
        "executed_at":  datetime.now()
    }