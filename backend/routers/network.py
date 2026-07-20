from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
import shutil

from database import get_db
from models import NetworkItem
from schemas import NetworkItemResponse
from auth import get_current_user
from utils import optimize_and_save_image

router = APIRouter(
    prefix="/network",
    tags=["network"]
)

# Directorio para subir las fotos del network
UPLOAD_DIR = "uploads/network"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[NetworkItemResponse])
def get_network_items(db: Session = Depends(get_db)):
    items = db.query(NetworkItem).order_by(NetworkItem.created_at.desc()).all()
    return items

@router.post("/", response_model=NetworkItemResponse)
def create_network_item(
    title: str = Form(...),
    description: str = Form(...),
    contact_name: str = Form(...),
    contact_phone: Optional[str] = Form(None),
    contact_email: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    photo_url = None
    if photo and photo.filename:
        photo_url = optimize_and_save_image(photo, UPLOAD_DIR)

    new_item = NetworkItem(
        user_id=current_user.id,
        title=title,
        description=description,
        contact_name=contact_name,
        contact_phone=contact_phone,
        contact_email=contact_email,
        category=category,
        photo_url=photo_url
    )
    
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item
