import os
import sys
from datetime import datetime, timedelta
import random

# Ensure we can import from backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import database
from database import SessionLocal
import models
import security

def seed_data():
    models.Base.metadata.create_all(bind=database.engine)
    db = SessionLocal()
    
    try:
        # 1. Get or create coach
        coach_email = "gerardo@gscodecr.com"
        coach = db.query(models.User).filter(models.User.email == coach_email).first()
        
        if not coach:
            coach_role = db.query(models.Role).filter(models.Role.name == "coach").first()
            if not coach_role:
                coach_role = models.Role(name="coach", permissions="{}")
                db.add(coach_role)
                db.commit()
                db.refresh(coach_role)
                
            coach = models.User(
                email=coach_email,
                first_name="Gerardo",
                last_name="Soto",
                hashed_password=security.get_password_hash("123456"),
                is_active=True,
                is_approved=True,
                role_id=coach_role.id
            )
            db.add(coach)
            db.commit()
            db.refresh(coach)
            print(f"Created coach: {coach.email}")
        else:
            print(f"Coach already exists: {coach.email}")

        # 2. Get or create athletes
        athlete_role = db.query(models.Role).filter(models.Role.name == "athlete").first()
        if not athlete_role:
            athlete_role = models.Role(name="athlete", permissions="{}")
            db.add(athlete_role)
            db.commit()
            db.refresh(athlete_role)
            
        athletes_data = [
            {"email": "alina@gscodecr.com", "first_name": "Alina", "last_name": "Viquez"},
            {"email": "carlos@gscodecr.com", "first_name": "Carlos", "last_name": "Ruiz"},
            {"email": "maria@gscodecr.com", "first_name": "Maria", "last_name": "Alfaro"}
        ]
        
        athlete_users = []
        for a_data in athletes_data:
            athlete = db.query(models.User).filter(models.User.email == a_data["email"]).first()
            if not athlete:
                athlete = models.User(
                    email=a_data["email"],
                    first_name=a_data["first_name"],
                    last_name=a_data["last_name"],
                    hashed_password=security.get_password_hash("123456"),
                    is_active=True,
                    is_approved=True,
                    role_id=athlete_role.id
                )
                db.add(athlete)
                db.commit()
                db.refresh(athlete)
                print(f"Created athlete: {athlete.first_name} {athlete.last_name}")
            else:
                print(f"Athlete already exists: {athlete.first_name} {athlete.last_name}")
            athlete_users.append(athlete)

        # 3. Create workouts for the current week
        # Clear existing workouts to avoid massive duplicates if run multiple times
        # db.query(models.Workout).delete()
        # db.commit()
        
        now = datetime.now()
        day_of_week = now.weekday() # 0 = Monday, 6 = Sunday
        start_of_week = now - timedelta(days=day_of_week)
        start_of_week = start_of_week.replace(hour=6, minute=0, second=0, microsecond=0)
        
        disciplines = ["ciclismo", "natacion", "atletismo", "fuerza", "triatlon"]
        workout_titles = {
            "ciclismo": ["Fondo 100km", "Intervalos VO2Max", "Recuperación Activa", "Z2 Base"],
            "natacion": ["Técnica y Series", "Fondo 3000m", "Velocidad Corta"],
            "atletismo": ["Pista 400m", "Fondo Dominical", "Fartlek"],
            "fuerza": ["Pierna y Core", "Fuerza Máxima", "Movilidad"],
            "triatlon": ["Transición Bici-Trote", "Simulación de Carrera"]
        }
        
        workouts_added = 0
        for athlete in athlete_users:
            # Alina: Perfect compliance (all past workouts completed)
            # Carlos: Poor compliance
            # Maria: Medium compliance
            
            for i in range(7):
                current_day = start_of_week + timedelta(days=i)
                
                # Give Alina a workout every day except 1 rest day
                if athlete.first_name == "Alina" and i != 5: # Saturday rest
                    disc = random.choice(disciplines)
                    is_past = current_day < now
                    db.add(models.Workout(
                        coach_id=coach.id,
                        athlete_id=athlete.id,
                        title=random.choice(workout_titles[disc]),
                        description="Sesión generada automáticamente de prueba.",
                        scheduled_date=current_day,
                        discipline=disc,
                        is_completed=is_past # She completes everything in the past!
                    ))
                    workouts_added += 1
                
                # Carlos: Only 2 workouts a week, rarely does them
                if athlete.first_name == "Carlos" and i in [0, 2, 4]:
                    disc = random.choice(["ciclismo", "atletismo"])
                    db.add(models.Workout(
                        coach_id=coach.id,
                        athlete_id=athlete.id,
                        title=random.choice(workout_titles[disc]),
                        description="Sesión generada automáticamente de prueba.",
                        scheduled_date=current_day,
                        discipline=disc,
                        is_completed=False # Doesn't do them
                    ))
                    workouts_added += 1
                    
                # Maria: Medium
                if athlete.first_name == "Maria" and i in [1, 3, 5, 6]:
                    disc = random.choice(disciplines)
                    is_past = current_day < now
                    db.add(models.Workout(
                        coach_id=coach.id,
                        athlete_id=athlete.id,
                        title=random.choice(workout_titles[disc]),
                        description="Sesión generada automáticamente de prueba.",
                        scheduled_date=current_day,
                        discipline=disc,
                        is_completed=True if is_past and i != 1 else False # Missed Tuesday
                    ))
                    workouts_added += 1

        db.commit()
        print(f"Successfully added {workouts_added} workouts for the current week!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting database seed...")
    seed_data()
    print("Seed complete.")
