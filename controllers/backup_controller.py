# controllers/backup_controller.py
from sqlalchemy.orm import Session
from models.router import Router
from models.device import Device
from models.user import User
from models.ftp import FTPServer
from netmiko import ConnectHandler
from datetime import datetime

def run_backup(router_id: int, ftp_id: int, user_id: int, db: Session):

    # 0. Validate user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}

    # 1. Fetch router
    router = db.query(Router).filter(Router.id == router_id).first()
    if not router:
        return {"error": "Router not found"}

    # 2. Fetch device
    device = db.query(Device).filter(Device.id == router.device_id).first()
    if not device:
        return {"error": "Device type not found"}

    # 3. Fetch TFTP server
    ftp = db.query(FTPServer).filter(FTPServer.id == ftp_id).first()
    if not ftp:
        return {"error": "TFTP server not found"}

    # 4. Check device supports TFTP backup
    if not device.backup_tftp_command:
        return {"error": f"{device.name} does not support TFTP backup"}

    # 5. Build filename + TFTP command
    date_str     = datetime.now().strftime("%Y-%m-%d_%H-%M")
    filename     = f"{router.name}_{date_str}"

    tftp_command = device.backup_tftp_command\
        .replace("{tftp_host}", ftp.host)\
        .replace("{filename}", filename)

    # 6. Build netmiko connection
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

    # 7. Connect → run both commands
    try:
        connection = ConnectHandler(**connection_params)

        connection.find_prompt()

        if router.secret:
            connection.enable()
        
        # TFTP command
        dat_output = connection.send_command_timing(
            tftp_command,
            delay_factor=4
        )

        connection.disconnect()

    except Exception as e:
        return {"error": f"Router connection failed: {str(e)}"}

    return {
        "router_name":  router.name,
        "ftp_server":   ftp.name,
        "filename_txt": f"{filename}.txt",
        "filename_dat": f"{filename}.dat",
        "dat_output":   dat_output,
        "status":       "success",
        "executed_at":  datetime.now()
    }