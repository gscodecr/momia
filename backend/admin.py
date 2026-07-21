from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List

import schemas, models, database
from auth import get_current_user
from datetime import datetime, timezone
import re

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

@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")
        
    now = datetime.now()
    
    # 1. Ingresos del mes actual
    current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    payments_this_month = db.query(models.Payment).filter(
        models.Payment.status == "APPROVED",
        models.Payment.created_at >= current_month_start
    ).all()
    
    total_ingresos = 0.0
    for p in payments_this_month:
        try:
            # Limpiar el string de amount, e.g. "45,000" o "₡45000" a "45000"
            clean_amount = re.sub(r'[^\d.]', '', str(p.amount)) if p.amount else "0"
            total_ingresos += float(clean_amount)
        except Exception:
            pass
            
    # 2. Atletas Activos
    active_athletes = db.query(models.User).join(models.Role).filter(
        models.Role.name == "athlete",
        models.User.is_active == True
    ).count()
    
    # 3. Atletas Morosos (Option B: next_payment_date expirado)
    overdue_athletes_query = db.query(models.User).join(models.Role).filter(
        models.Role.name == "athlete",
        models.User.is_active == True,
        models.User.next_payment_date != None,
        models.User.next_payment_date < now
    ).all()
    
    overdue_athletes_list = []
    for u in overdue_athletes_query:
        overdue_athletes_list.append({
            "id": u.id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "avatar_url": u.avatar_url,
            "next_payment_date": str(u.next_payment_date) if u.next_payment_date else None
        })
    overdue_count = len(overdue_athletes_list)
    
    # 4. Últimos Registros
    recent_users = db.query(models.User).join(models.Role).filter(
        models.Role.name == "athlete"
    ).order_by(models.User.created_at.desc()).limit(5).all()
    
    recent_athletes_list = []
    for u in recent_users:
        profile = db.query(models.AthleteProfile).filter(models.AthleteProfile.user_id == u.id).first()
        recent_athletes_list.append({
            "id": u.id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "avatar_url": u.avatar_url,
            "discipline": profile.discipline if profile and profile.discipline else "No asignado",
            "is_active": u.is_active
        })
        
    # 5. Alertas del Sistema
    pending_sinpe = db.query(models.Payment).filter(models.Payment.status == "PENDING").count()
    pending_approval = db.query(models.User).filter(models.User.is_approved == False).count()
    
    return {
        "ingresos_mes": total_ingresos,
        "atletas_activos": active_athletes,
        "atletas_morosos": overdue_count,
        "morosos_list": overdue_athletes_list,
        "ultimos_registros": recent_athletes_list,
        "alertas": {
            "comprobantes_pendientes": pending_sinpe,
            "atletas_por_aprobar": pending_approval
        }
    }

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

@router.put("/users/{user_id}/coach", response_model=schemas.UserOut)
def assign_coach_to_user(user_id: int, request: schemas.AssignCoachRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    profile = db.query(models.AthleteProfile).filter(models.AthleteProfile.user_id == user_id).first()
    if not profile:
        # Create a blank profile if it doesn't exist
        profile = models.AthleteProfile(user_id=user_id, discipline="triatlon", coach_id=request.coach_id)
        db.add(profile)
    else:
        profile.coach_id = request.coach_id
        
    db.commit()
    db.refresh(user)
    return user

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

@router.get("/orders", response_model=List[schemas.OrderOut])
def get_orders(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")
    return db.query(models.Order).order_by(models.Order.created_at.desc()).all()

@router.put("/orders/{order_id}/deliver", response_model=schemas.OrderOut)
def deliver_order(order_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")
    
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    order.status = "ENTREGADO"
    db.commit()
    db.refresh(order)
    return order
