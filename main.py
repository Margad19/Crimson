from fastapi import FastAPI
from routes import routers

app = FastAPI(title="Router Automation API")

app.include_router(routers.router)

@app.get("/")
def root():
    return {"status": "running"}