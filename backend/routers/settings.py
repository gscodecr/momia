from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict

import models
import database
from auth import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])

class SettingUpdate(BaseModel):
    key: str
    value: str

class SettingsUpdateList(BaseModel):
    settings: List[SettingUpdate]

@router.get("/")
def get_settings(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """
    Obtener todas las configuraciones. Accesible para cualquier usuario autenticado.
    """
    settings = db.query(models.BusinessSettings).all()
    result = {s.key: {"value": s.value, "description": s.description} for s in settings}
    return result

@router.put("/")
def update_settings(data: SettingsUpdateList, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """
    Actualizar configuraciones. Solo accesible para administradores.
    """
    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción")
    
    for item in data.settings:
        setting = db.query(models.BusinessSettings).filter(models.BusinessSettings.key == item.key).first()
        if setting:
            setting.value = item.value
        else:
            # If not exists, we create it without description
            new_setting = models.BusinessSettings(key=item.key, value=item.value)
            db.add(new_setting)
            
    db.commit()
    return {"message": "Configuraciones actualizadas exitosamente"}
