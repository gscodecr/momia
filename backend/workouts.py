from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
from auth import get_current_user
import utils
from services import email_service

router = APIRouter(
    prefix="/workouts",
    tags=["workouts"]
)

@router.get("/athletes", response_model=List[schemas.UserOut])
def get_coach_athletes(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role.name not in ["admin", "coach"]:
        raise HTTPException(status_code=403, detail="No autorizado")
    # For now, return all active athletes as potential assignees
    athletes = db.query(models.User).join(models.Role).filter(models.Role.name == "athlete", models.User.is_active == True).all()
    return athletes

@router.put("/athletes/{athlete_id}", response_model=schemas.UserOut)
def update_athlete_profile(athlete_id: int, profile_update: schemas.UserUpdateProfile, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role.name not in ["admin", "coach"]:
        raise HTTPException(status_code=403, detail="No autorizado")
        
    athlete = db.query(models.User).filter(models.User.id == athlete_id).first()
    if not athlete or athlete.role.name != "athlete":
        raise HTTPException(status_code=404, detail="Atleta no encontrado")
        
    profile = db.query(models.AthleteProfile).filter(models.AthleteProfile.user_id == athlete_id).first()
    if not profile:
        profile = models.AthleteProfile(user_id=athlete_id, discipline="triatlon")
        db.add(profile)
        
    if profile_update.ftp is not None:
        profile.ftp = profile_update.ftp
    if profile_update.injuries is not None:
        profile.injuries = profile_update.injuries
    if profile_update.heart_rate_zones is not None:
        profile.heart_rate_zones = profile_update.heart_rate_zones
    if profile_update.discipline is not None:
        profile.discipline = profile_update.discipline
    if profile_update.weight is not None:
        profile.weight = profile_update.weight
    if profile_update.body_fat is not None:
        profile.body_fat = profile_update.body_fat
        
    db.commit()
    db.refresh(athlete)
    return athlete

@router.get("/", response_model=List[schemas.WorkoutOut])
def get_workouts(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.role:
        return db.query(models.Workout).filter(models.Workout.athlete_id == current_user.id).all()
        
    if current_user.role.name == "admin":
        return db.query(models.Workout).all()
    elif current_user.role.name == "coach":
        return db.query(models.Workout).filter(models.Workout.coach_id == current_user.id).all()
    else:
        return db.query(models.Workout).filter(models.Workout.athlete_id == current_user.id).all()

@router.get("/athlete/{athlete_id}", response_model=List[schemas.WorkoutOut])
def get_workouts_by_athlete(athlete_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role.name == "athlete" and current_user.id != athlete_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
        
    return db.query(models.Workout).filter(models.Workout.athlete_id == athlete_id).all()

@router.post("/", response_model=schemas.WorkoutOut)
def create_workout(workout: schemas.WorkoutCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role.name not in ["admin", "coach"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo los entrenadores pueden asignar rutinas")
    
    new_workout = models.Workout(**workout.dict(), coach_id=current_user.id)
    db.add(new_workout)
    db.commit()
    db.refresh(new_workout)
    
    # Notify athlete
    athlete = db.query(models.User).filter(models.User.id == new_workout.athlete_id).first()
    if athlete:
        utils.create_notification(
            db, 
            user_id=athlete.id, 
            title="Nuevo entrenamiento", 
            message=f"Tu entrenador ha asignado: {new_workout.title}", 
            notif_type="WORKOUT"
        )
        if athlete.email:
            background_tasks.add_task(
                email_service.send_workout_assigned_email,
                to_email=athlete.email,
                athlete_name=athlete.first_name,
                workout_title=new_workout.title,
                date=str(new_workout.scheduled_date.date())
            )
            
    return new_workout

@router.put("/{workout_id}", response_model=schemas.WorkoutOut)
def update_workout(workout_id: int, workout_data: schemas.WorkoutUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workout = db.query(models.Workout).filter(models.Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")
        
    # Security checks
    if current_user.role.name == "athlete" and workout.athlete_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
        
    for key, value in workout_data.dict(exclude_unset=True).items():
        setattr(workout, key, value)
        
    db.commit()
    db.refresh(workout)
    return workout

@router.delete("/{workout_id}")
def delete_workout(workout_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role.name not in ["admin", "coach"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo los entrenadores pueden eliminar rutinas")
        
    workout = db.query(models.Workout).filter(models.Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Rutina no encontrada")
        
    # Check if coach owns it or is admin
    if current_user.role.name == "coach" and workout.coach_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para eliminar esta rutina")
        
    db.delete(workout)
    db.commit()
    return {"message": "Rutina eliminada exitosamente"}
