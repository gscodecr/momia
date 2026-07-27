from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
from auth import get_current_user
import utils
from services import email_service

router = APIRouter(
    prefix="/events",
    tags=["events"]
)

@router.get("/", response_model=List[schemas.EventOut])
def get_events(db: Session = Depends(get_db)):
    return db.query(models.Event).order_by(models.Event.date).all()

@router.post("/", response_model=schemas.EventOut)
def create_event(event: schemas.EventCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role.name not in ["admin", "coach"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    
    new_event = models.Event(**event.dict())
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    # Notify all athletes
    athletes = db.query(models.User).join(models.Role).filter(models.Role.name == "athlete", models.User.is_active == True).all()
    for athlete in athletes:
        if athlete.email:
            background_tasks.add_task(
                email_service.send_event_notification_email, 
                to_email=athlete.email, 
                event_title=new_event.title, 
                date=str(new_event.date.date())
            )
            
    return new_event

@router.post("/{event_id}/register", response_model=schemas.EventRegistrationOut)
def register_for_event(event_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
        
    existing = db.query(models.EventRegistration).filter(
        models.EventRegistration.event_id == event_id,
        models.EventRegistration.user_id == current_user.id
    ).first()
    
    if existing:
        if existing.status == "CANCELLED":
            existing.status = "REGISTERED"
            db.commit()
            db.refresh(existing)
            return existing
        raise HTTPException(status_code=400, detail="Ya estás registrado en este evento")
        
    reg = models.EventRegistration(event_id=event_id, user_id=current_user.id)
    db.add(reg)
    db.commit()
    db.refresh(reg)
    
    # Notify user
    utils.create_notification(db, user_id=current_user.id, title="Registro Exitoso", message=f"Te has registrado al evento: {event.title}.", notif_type="EVENT")
    if current_user.email:
        background_tasks.add_task(email_service.send_event_registration_email, to_email=current_user.email, user_name=current_user.first_name, event_title=event.title)
        
    return reg

@router.get("/my_registrations", response_model=List[schemas.EventRegistrationOut])
def get_my_registrations(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.EventRegistration).filter(
        models.EventRegistration.user_id == current_user.id,
        models.EventRegistration.status == "REGISTERED"
    ).all()

@router.delete("/{event_id}/register")
def unregister_from_event(event_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing = db.query(models.EventRegistration).filter(
        models.EventRegistration.event_id == event_id,
        models.EventRegistration.user_id == current_user.id,
        models.EventRegistration.status == "REGISTERED"
    ).first()
    
    if not existing:
        raise HTTPException(status_code=400, detail="No estás registrado en este evento")
        
    existing.status = "CANCELLED"
    db.commit()
    return {"detail": "Inscripción cancelada"}

@router.get("/{event_id}/registrations", response_model=List[schemas.EventRegistrationOut])
def get_event_registrations(event_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.role or current_user.role.name not in ["admin", "coach"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    
    regs = db.query(models.EventRegistration).filter(
        models.EventRegistration.event_id == event_id, 
        models.EventRegistration.status == "REGISTERED"
    ).all()
    
    for reg in regs:
        workout = db.query(models.Workout).filter(
            models.Workout.athlete_id == reg.user_id,
            models.Workout.event_id == event_id
        ).first()
        setattr(reg, "has_plan", workout is not None)
        
    return regs
