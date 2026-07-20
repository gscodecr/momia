import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import models
from database import engine
from auth import router as auth_router
from admin import router as admin_router
from payments import router as payments_router
from chat import router as chat_router
from marketplace import router as marketplace_router
from events import router as events_router
from workouts import router as workouts_router
from routers.notifications import router as notifications_router
from routers.network import router as network_router

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Momia TS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(payments_router)
app.include_router(chat_router)
app.include_router(marketplace_router)
app.include_router(events_router)
app.include_router(workouts_router)
app.include_router(notifications_router)
app.include_router(network_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Momia TS API"}
