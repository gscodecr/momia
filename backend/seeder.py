import os
from dotenv import load_dotenv
from database import SessionLocal
import models
import security

load_dotenv()

def seed_database():
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

        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
        coach_password = os.getenv("COACH_PASSWORD", "coach123")

        # Verificar si existe el usuario master
        master_user = db.query(models.User).filter(models.User.email == "gerardo@gscodecr.com").first()
        if not master_user:
            master_user = models.User(
                email="gerardo@gscodecr.com",
                hashed_password=security.get_password_hash(admin_password),
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
                hashed_password=security.get_password_hash(coach_password),
                first_name="Test",
                last_name="Coach",
                is_active=True,
                is_approved=True,
                role_id=coach_role.id
            )
            db.add(test_coach)

        db.commit()
        print("Base de datos inicializada con éxito.")
    except Exception as e:
        print(f"Error inicializando base de datos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
