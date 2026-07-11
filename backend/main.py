from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from auth import router as auth_router
from admin import router as admin_router
from payments import router as payments_router
from chat import router as chat_router
from marketplace import router as marketplace_router
from events import router as events_router
from workouts import router as workouts_router

models.Base.metadata.create_all(bind=engine)

from contextlib import asynccontextmanager
from database import SessionLocal
import security

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Seeder Inicial ---
    db = SessionLocal()
    try:
        # Verificar si existe el rol admin
        admin_role = db.query(models.Role).filter(models.Role.name == "admin").first()
        if not admin_role:
            admin_role = models.Role(name="admin", permissions="all")
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)

        # Verificar si existe el rol coach
        coach_role = db.query(models.Role).filter(models.Role.name == "coach").first()
        if not coach_role:
            coach_role = models.Role(name="coach", permissions="read_athletes")
            db.add(coach_role)
            db.commit()
            db.refresh(coach_role)

        # Verificar si existe el rol athlete
        athlete_role = db.query(models.Role).filter(models.Role.name == "athlete").first()
        if not athlete_role:
            athlete_role = models.Role(name="athlete", permissions="read_workouts")
            db.add(athlete_role)
            db.commit()
            db.refresh(athlete_role)

        # Verificar si existe el usuario master
        master_user = db.query(models.User).filter(models.User.email == "gerardo@gscodecr.com").first()
        if not master_user:
            master_user = models.User(
                email="gerardo@gscodecr.com",
                hashed_password=security.get_password_hash("231287"),
                first_name="Gerardo",
                last_name="Soto",
                is_active=True,
                is_approved=True,
                role_id=admin_role.id
            )
            db.add(master_user)

        # Verificar si existe el usuario coach
        test_coach = db.query(models.User).filter(models.User.email == "coach@gscodecr.com").first()
        if not test_coach:
            test_coach = models.User(
                email="coach@gscodecr.com",
                hashed_password=security.get_password_hash("coach123"),
                first_name="Test",
                last_name="Coach",
                is_active=True,
                is_approved=True,
                role_id=coach_role.id
            )
            db.add(test_coach)

        db.commit()
    finally:
        db.close()
    yield

app = FastAPI(title="Momia TS API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(payments_router)
app.include_router(chat_router)
app.include_router(marketplace_router)
app.include_router(events_router)
app.include_router(workouts_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Momia TS API"}
