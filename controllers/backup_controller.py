# controllers/backup_controller.py
from sqlalchemy.orm import Session
from models.router import Router
from models.device import Device
from models.user import User
from models.ftp import FTPServer
from netmiko import ConnectHandler
from datetime import datetime
import io
import tftpy

def run_backup(router_id: int, ftp_id: int, user_id: int, db: Session):

    # 0. Validate user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}

    # 1. Fetch router
    router = db.query(Router).filter(Router.id == router_id).first()
    if not router:
        return {"error": "Router not found"}

    # 2. Fetch device → get backup_command
    device = db.query(Device).filter(Device.id == router.device_id).first()
    if not device:
        return {"error": "Device type not found"}

    # 3. Fetch FTP server
    ftp = db.query(FTPServer).filter(FTPServer.id == ftp_id).first()
    if not ftp:
        return {"error": "FTP server not found"}

    # 4. Build netmiko connection
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

    # 5. Connect → get config
    try:
        connection = ConnectHandler(**connection_params)

        if router.secret:
            connection.enable(
                cmd_verify=False,
                pattern=r'#'
            )

        output = connection.send_command(device.backup_command)
        connection.disconnect()

    except Exception as e:
        return {"error": f"Router connection failed: {str(e)}"}

    # 6. Build filename
    date_str = datetime.now().strftime("%Y-%m-%d_%H-%M")
    filename     = f"{router.name}_{date_str}.txt"
    filename_dat = f"{router.name}_{date_str}.dat"

    # 7. Send to TFTP
    try:
        # Write temp files locally first
        with open(filename, "w") as f:
            f.write(output)

        with open(filename_dat, "w") as f:
            f.write(output)

        import time

        client = tftpy.TftpClient(ftp.host, 69)
        client.upload(filename, filename)
        time.sleep(2)                             # ← wait for transfer
        client.upload(filename_dat, filename_dat)
        time.sleep(2)                             # ← wait for transfer

    except Exception as e:
        return {"error": f"TFTP upload failed: {str(e)}"}

    finally:
        import os
        if os.path.exists(filename):     os.remove(filename)
        if os.path.exists(filename_dat): os.remove(filename_dat)

    return {
        "router_name": router.name,
        "ftp_server":  ftp.name,
        "filename":    filename,
        "status":      "success",
        "executed_at": datetime.now()
    }