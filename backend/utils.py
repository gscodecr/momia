import os
import uuid
from PIL import Image
from fastapi import UploadFile
from sqlalchemy.orm import Session
import models

def optimize_and_save_image(upload_file: UploadFile, dest_folder: str, max_width: int = 800) -> str:
    """
    Optimiza una imagen y la guarda en la carpeta destino.
    Retorna la ruta relativa (ej. /uploads/filename.webp)
    """
    if not os.path.exists(dest_folder):
        os.makedirs(dest_folder)
        
    # Generate unique filename
    ext = ".webp"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(dest_folder, filename)
    
    # Open image with Pillow and fix EXIF orientation
    img = Image.open(upload_file.file)
    try:
        from PIL import ImageOps
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass
    
    # Convert to RGB if it's RGBA or P (to avoid errors when saving as WebP/JPEG)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
        
    # Resize if too large
    if img.width > max_width:
        ratio = max_width / float(img.width)
        new_height = int((float(img.height) * float(ratio)))
        img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
        
    # Save optimized
    img.save(filepath, format="WEBP", quality=80)
    
    # Return relative URL path
    # Example: if dest_folder is 'uploads/avatars', it returns '/uploads/avatars/filename.webp'
    return f"/{dest_folder}/{filename}"

def create_notification(db: Session, user_id: int, title: str, message: str, notif_type: str):
    """
    Creates an in-app notification for a user.
    """
    notif = models.Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
