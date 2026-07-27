from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any
from fastapi import UploadFile, File

import schemas, models, security, database, utils
from services.email_service import send_welcome_email, send_forgot_password_email
router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/register", response_model=schemas.UserOut)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(database.get_db)) -> Any:
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="The user with this email already exists.")
    
    hashed_password = security.get_password_hash(user_in.password)
    new_user = models.User(
        email=user_in.email,
        hashed_password=hashed_password,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        role_id=user_in.role_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Enviar correo de bienvenida/en revisión
    send_welcome_email(to_email=new_user.email, first_name=new_user.first_name)
    
    return new_user

@router.post("/forgot-password")
def forgot_password(req: schemas.ForgotPasswordRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if user:
        reset_token = security.create_reset_token(user.email)
        send_forgot_password_email(to_email=user.email, first_name=user.first_name, reset_token=reset_token)
    # Siempre retornamos lo mismo por seguridad, exista o no el correo
    return {"message": "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña."}

@router.post("/reset-password")
def reset_password(req: schemas.ResetPasswordRequest, db: Session = Depends(database.get_db)):
    email = security.verify_reset_token(req.token)
    if not email:
        raise HTTPException(status_code=400, detail="Token inválido o expirado.")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    
    user.hashed_password = security.get_password_hash(req.new_password)
    db.commit()
    return {"message": "Contraseña actualizada exitosamente."}

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)) -> Any:
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )
    if not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )
    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tu cuenta está pendiente de aprobación por un administrador.",
        )
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    role_name = user.role.name if user.role else "athlete"
    return {"access_token": access_token, "token_type": "bearer", "role": role_name}

def get_current_user(db: Session = Depends(database.get_db), token: str = Depends(oauth2_scheme)):
    from jose import jwt, JWTError
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.get("/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.UserOut)
def update_users_me(user_update: schemas.UserUpdateProfile, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if user_update.first_name is not None:
        current_user.first_name = user_update.first_name
    if user_update.last_name is not None:
        current_user.last_name = user_update.last_name
    if user_update.password:
        current_user.hashed_password = security.get_password_hash(user_update.password)
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url
    if user_update.phone is not None:
        current_user.phone = user_update.phone
    if user_update.address is not None:
        current_user.address = user_update.address
    if user_update.birth_date is not None:
        current_user.birth_date = user_update.birth_date
    if user_update.gender is not None:
        current_user.gender = user_update.gender
    if user_update.payment_preference is not None:
        current_user.payment_preference = user_update.payment_preference
    if user_update.subscription_type is not None:
        current_user.subscription_type = user_update.subscription_type
    if user_update.subscription_status is not None:
        current_user.subscription_status = user_update.subscription_status
    if user_update.emergency_contact_name is not None:
        current_user.emergency_contact_name = user_update.emergency_contact_name
    if user_update.emergency_contact_phone is not None:
        current_user.emergency_contact_phone = user_update.emergency_contact_phone
        
    # Athlete Profile updates
    if current_user.role.name == "athlete":
        profile = db.query(models.AthleteProfile).filter(models.AthleteProfile.user_id == current_user.id).first()
        if not profile:
            profile = models.AthleteProfile(user_id=current_user.id, discipline="triatlon")
            db.add(profile)
            
        if user_update.ftp is not None:
            profile.ftp = user_update.ftp
        if user_update.injuries is not None:
            profile.injuries = user_update.injuries
        if user_update.heart_rate_zones is not None:
            profile.heart_rate_zones = user_update.heart_rate_zones
        if user_update.discipline is not None:
            profile.discipline = user_update.discipline
        if user_update.weight is not None:
            profile.weight = user_update.weight
        if user_update.body_fat is not None:
            profile.body_fat = user_update.body_fat
            
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/avatar", response_model=schemas.UserOut)
async def upload_avatar(file: UploadFile = File(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    url = utils.optimize_and_save_image(file, dest_folder="uploads/avatars")
    current_user.avatar_url = url
    db.commit()
    db.refresh(current_user)
    return current_user
