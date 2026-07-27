from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
from auth import get_current_user
import utils
from fastapi import BackgroundTasks
from services import email_service
router = APIRouter(
    prefix="/products",
    tags=["marketplace"]
)

@router.get("/", response_model=List[schemas.ProductOut])
def get_products(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    all_products = db.query(models.Product).filter(models.Product.is_active == True).all()
    
    if current_user.role.name != "athlete":
        return all_products
        
    athlete_profile = db.query(models.AthleteProfile).filter(models.AthleteProfile.user_id == current_user.id).first()
    user_disciplines = set(athlete_profile.discipline.split(',')) if athlete_profile and athlete_profile.discipline else set()
    
    filtered = []
    for p in all_products:
        if not p.discipline:
            filtered.append(p)
        else:
            p_disciplines = set(p.discipline.split(','))
            if p_disciplines.intersection(user_disciplines):
                filtered.append(p)
                
    return filtered

@router.post("/upload")
async def upload_product_image(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
    if current_user.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    
    try:
        url = utils.optimize_and_save_image(file, dest_folder="uploads")
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=schemas.ProductOut)
def create_product(product: schemas.ProductCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Verify if user is admin
    if current_user.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
    
    new_product = models.Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    # Notify all athletes
    athletes = db.query(models.User).join(models.Role).filter(models.Role.name == "athlete", models.User.is_active == True).all()
    for athlete in athletes:
        if athlete.email:
            background_tasks.add_task(
                email_service.send_product_notification_email, 
                to_email=athlete.email, 
                product_name=new_product.name
            )
            
    return new_product

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
        
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    product.is_active = False # Soft delete
    db.commit()
    return {"message": "Producto eliminado exitosamente"}

@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(product_id: int, product_update: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role.name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")
        
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    for key, value in product_update.dict().items():
        setattr(product, key, value)
        
    db.commit()
    db.refresh(product)
    return product
