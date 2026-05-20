# main.py
from fastapi import FastAPI
from routes import routers, devices, commands, execute, users, ftp, backup, backup_schedule, schedules, onetime, terminal, auth
from scheduler import scheduler, load_jobs
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Router Automation API")

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(routers.router)
app.include_router(devices.router)
app.include_router(commands.router)
app.include_router(execute.router)
app.include_router(users.router)
app.include_router(ftp.router)
app.include_router(backup.router)
app.include_router(backup_schedule.router)
app.include_router(schedules.router)
app.include_router(onetime.router)
app.include_router(terminal.router)
app.include_router(auth.router)

@app.on_event("startup")
def startup():
    scheduler.start()       # ← start scheduler
    load_jobs()             # ← load active schedules from DB

@app.on_event("shutdown")
def shutdown():
    scheduler.shutdown()    # ← clean stop

@app.get("/")
def root():
    return {"status": "running"}

