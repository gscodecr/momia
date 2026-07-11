from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List

import schemas, models, database
from auth import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/roles", response_model=schemas.RoleOut)
def create_role(role: schemas.RoleCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # En un sistema real aquí verificaríamos que current_user tenga permisos de Súper Admin
    db_role = db.query(models.Role).filter(models.Role.name == role.name).first()
    if db_role:
        raise HTTPException(status_code=400, detail="El rol ya existe")
    
    new_role = models.Role(name=role.name, permissions=role.permissions)
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role

@router.get("/roles", response_model=List[schemas.RoleOut])
def get_roles(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Role).all()

@router.post("/assign_coach", response_model=schemas.AthleteProfileOut)
def assign_coach(athlete_id: int, coach_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Buscar si el atleta ya tiene perfil
    profile = db.query(models.AthleteProfile).filter(models.AthleteProfile.user_id == athlete_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil de atleta no encontrado")
    
    # 2. Validar que el coach exista
    coach = db.query(models.User).filter(models.User.id == coach_id).first()
    if not coach:
        raise HTTPException(status_code=404, detail="Entrenador no encontrado")
    
    profile.coach_id = coach_id
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/my_athletes", response_model=List[schemas.AthleteProfileOut])
def get_my_athletes(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """ Endpoint para que un Entrenador vea a los atletas que le han sido asignados """
    athletes = db.query(models.AthleteProfile).filter(models.AthleteProfile.coach_id == current_user.id).all()
    return athletes

@router.get("/users/pending", response_model=List[schemas.UserOut])
def get_pending_users(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """ Súper Admin: Ver usuarios pendientes de aprobación """
    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")
    return db.query(models.User).filter(models.User.is_approved == False).all()

@router.get("/users", response_model=List[schemas.UserOut])
def get_all_users(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """ Súper Admin: Ver todos los usuarios """
    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")
    return db.query(models.User).all()

@router.post("/users", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """ Súper Admin: Crear un usuario directamente """
    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")
        
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
        
    import security
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        role_id=user.role_id,
        is_approved=True,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/users/{user_id}/role", response_model=schemas.UserOut)
def update_user_role(user_id: int, role_data: schemas.UserUpdateRole, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """ Súper Admin: Actualizar rol de un usuario """
    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    user.role_id = role_data.role_id
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/{user_id}/status", response_model=schemas.UserOut)
def update_user_status(user_id: int, status_data: schemas.UserUpdateStatus, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """ Súper Admin: Activar/Desactivar o Aprobar/Rechazar un usuario """
    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    if status_data.is_active is not None:
        user.is_active = status_data.is_active
    if status_data.is_approved is not None:
        user.is_approved = status_data.is_approved
        
    db.commit()
    db.refresh(user)
    return user

@router.post("/users/{user_id}/approve")
def approve_user(user_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """ Súper Admin: Aprobar usuario (legacy) """
    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    user.is_approved = True
    db.commit()
    return {"message": "Usuario aprobado exitosamente"}
