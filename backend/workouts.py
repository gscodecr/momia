from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
from auth import get_current_user

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
def create_workout(workout: schemas.WorkoutCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role.name not in ["admin", "coach"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo los entrenadores pueden asignar rutinas")
    
    new_workout = models.Workout(**workout.dict(), coach_id=current_user.id)
    db.add(new_workout)
    db.commit()
    db.refresh(new_workout)
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
