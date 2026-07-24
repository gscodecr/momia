import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import models
from database import engine, SessionLocal
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

# Inicializar roles y usuario admin por defecto si no existen
def init_db():
    db = SessionLocal()
    try:
        # Crear roles si no existen
        roles = ["admin", "coach", "athlete"]
        for role_name in roles:
            if not db.query(models.Role).filter(models.Role.name == role_name).first():
                db.add(models.Role(name=role_name))
        db.commit()

        # Crear admin master si no existe ningún admin
        admin_role = db.query(models.Role).filter(models.Role.name == "admin").first()
        if admin_role:
            admin_email = os.getenv("ADMIN_EMAIL", "gerardo@gscodecr.com")
            if not db.query(models.User).filter(models.User.email == admin_email).first():
                import security
                admin_password = os.getenv("ADMIN_PASSWORD", "231287")
                hashed_password = security.get_password_hash(admin_password)
                admin_user = models.User(
                    email=admin_email,
                    hashed_password=hashed_password,
                    first_name="Gerardo",
                    last_name="Soto",
                    role_id=admin_role.id,
                    is_approved=True,
                    is_active=True
                )
                db.add(admin_user)
                db.commit()
    finally:
        db.close()

init_db()

app = FastAPI(title="Momia TS API")

# En producción, configurar MOMIA_CORS_ORIGINS en .env (ej. "https://midominio.com,https://app.midominio.com")
cors_origins_env = os.getenv("MOMIA_CORS_ORIGINS", "")
allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
if not allowed_origins:
    allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
