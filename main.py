# main.py
from fastapi import FastAPI
from routes import routers, devices, commands, execute, users, ftp, backup

app = FastAPI(title="Router Automation API")

app.include_router(routers.router)
app.include_router(devices.router)
app.include_router(commands.router)
app.include_router(execute.router)
app.include_router(users.router)
app.include_router(ftp.router)
app.include_router(backup.router)

@app.get("/")
def root():
    return {"status": "running"}