from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import schemas, models, database
from auth import get_current_user
import os
import shutil
import json
from fastapi import File, UploadFile, Form
from datetime import datetime
from dateutil.relativedelta import relativedelta

router = APIRouter(prefix="/payments", tags=["payments"])

@router.post("/manual", response_model=schemas.PaymentOut)
def submit_manual_payment(payment: schemas.PaymentCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """Endpoint para que el atleta suba un comprobante de SINPE o Transferencia"""
    if payment.payment_method not in ["SINPE", "TRANSFER"]:
        raise HTTPException(status_code=400, detail="Método manual inválido")
        
    new_payment = models.Payment(
        user_id=current_user.id,
        amount=payment.amount,
        currency=payment.currency,
        payment_method=payment.payment_method,
        status="PENDING",
        receipt_url=payment.receipt_url
    )
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    return new_payment

@router.get("/all", response_model=List[schemas.PaymentOut])
def get_all_payments(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """Endpoint para que el Súper Admin vea todos los pagos (pendientes, aprobados, rechazados)"""
    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")
    return db.query(models.Payment).order_by(models.Payment.id.desc()).all()

@router.post("/{payment_id}/approve")
def approve_payment(payment_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """Endpoint para que el Admin apruebe un comprobante"""
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    
    payment.status = "APPROVED"
    db.commit()
    return {"message": "Pago aprobado", "payment_id": payment.id}

@router.post("/{payment_id}/reject")
def reject_payment(payment_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """Endpoint para que el Admin rechace un comprobante"""
    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")
        
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    
    payment.status = "REJECTED"
    db.commit()
    return {"message": "Pago rechazado", "payment_id": payment.id}

@router.post("/tilopay/init")
def init_tilopay_payment(amount: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """Integración inicial con Tilopay (Mock)"""
    return {
        "payment_url": "https://pay.tilopay.com/mock-link-1234",
        "message": "Redirigiendo a pasarela Tilopay..."
    }

@router.get("/me")
def get_my_billing(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    payments = db.query(models.Payment).filter(models.Payment.user_id == current_user.id).order_by(models.Payment.created_at.desc()).all()
    return {
        "subscription_status": current_user.subscription_status,
        "next_payment_date": current_user.next_payment_date,
        "auto_pay": current_user.auto_pay,
        "subscription_type": current_user.subscription_type,
        "payment_preference": current_user.payment_preference,
        "payments": payments
    }

@router.put("/auto-pay")
def toggle_auto_pay(auto_pay: bool, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    current_user.auto_pay = auto_pay
    db.commit()
    return {"auto_pay": current_user.auto_pay}

@router.post("/tilopay/simulate")
def simulate_tilopay(amount: str, description: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # Create successful payment
    payment = models.Payment(
        user_id=current_user.id,
        amount=amount,
        description=description,
        currency="CRC",
        payment_method="TARJETA",
        status="APPROVED"
    )
    db.add(payment)
    
    # Bump next_payment_date
    if not current_user.next_payment_date:
        base_date = datetime.now()
    else:
        base_date = current_user.next_payment_date
        
    sub_type = (current_user.subscription_type or "").lower()
    months_to_add = 1 # default mensual
    if "trimestral" in sub_type:
        months_to_add = 3
    elif "semestral" in sub_type:
        months_to_add = 6
    elif "anual" in sub_type:
        months_to_add = 12
        
    current_user.next_payment_date = base_date + relativedelta(months=months_to_add)
    # Ensure status is active if it was paused
    if current_user.subscription_status != "Activo":
        current_user.subscription_status = "Activo"
        
    db.commit()
    return {"message": "Pago exitoso simulado", "next_payment_date": current_user.next_payment_date}

@router.post("/report-sinpe")
async def report_sinpe(amount: str, description: str, file: UploadFile = File(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    os.makedirs("uploads", exist_ok=True)
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"receipt_{current_user.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}{file_extension}"
    file_path = f"uploads/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    url = f"http://127.0.0.1:8001/uploads/{filename}"
    
    payment = models.Payment(
        user_id=current_user.id,
        amount=amount,
        description=description,
        currency="CRC",
        payment_method="SINPE",
        status="PENDING",
        receipt_url=url
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

@router.post("/store-tilopay")
def simulate_store_tilopay(checkout: schemas.StoreCheckout, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # Deduct stock
    for item in checkout.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            qty = item.quantity
            if product.variants_json and item.selectedColor and item.selectedSize:
                try:
                    variants = json.loads(product.variants_json)
                    new_variants = []
                    total_stock = 0
                    for v in variants:
                        if v.get('color') == item.selectedColor and v.get('size') == item.selectedSize:
                            v['stock'] = max(0, v.get('stock', 0) - qty)
                        new_variants.append(v)
                        total_stock += v.get('stock', 0)
                    product.variants_json = json.dumps(new_variants)
                    product.stock = total_stock
                except:
                    product.stock = max(0, product.stock - qty)
            else:
                product.stock = max(0, product.stock - qty)
    payment = models.Payment(
        user_id=current_user.id,
        amount=checkout.amount,
        description=checkout.description,
        currency="CRC",
        payment_method="TARJETA",
        status="APPROVED"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    # Create Order
    order = models.Order(
        user_id=current_user.id,
        payment_id=payment.id,
        items_json=json.dumps([item.dict() for item in checkout.items]),
        total_amount=checkout.amount,
        status="PENDIENTE"
    )
    db.add(order)
    db.commit()
    
    return {"message": "Compra exitosa", "payment_id": payment.id, "order_id": order.id}

@router.post("/store-sinpe")
async def store_sinpe(amount: str = Form(...), description: str = Form(...), items_json: str = Form(...), file: UploadFile = File(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    try:
        items = json.loads(items_json)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail="Formato de items_json inválido.")
        
    for item in items:
        product = db.query(models.Product).filter(models.Product.id == item.get('product_id')).first()
        if product:
            qty = item.get('quantity', 1)
            selected_color = item.get('selectedColor')
            selected_size = item.get('selectedSize')
            
            if product.variants_json and selected_color and selected_size:
                try:
                    variants = json.loads(product.variants_json)
                    new_variants = []
                    total_stock = 0
                    for v in variants:
                        if v.get('color') == selected_color and v.get('size') == selected_size:
                            v['stock'] = max(0, v.get('stock', 0) - qty)
                        new_variants.append(v)
                        total_stock += v.get('stock', 0)
                    product.variants_json = json.dumps(new_variants)
                    product.stock = total_stock
                except Exception as e:
                    product.stock = max(0, product.stock - qty)
            else:
                product.stock = max(0, product.stock - qty)
    os.makedirs("uploads", exist_ok=True)
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"store_receipt_{current_user.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}{file_extension}"
    file_path = f"uploads/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    url = f"http://127.0.0.1:8001/uploads/{filename}"
    
    payment = models.Payment(
        user_id=current_user.id,
        amount=amount,
        description=description,
        currency="CRC",
        payment_method="SINPE",
        status="PENDING",
        receipt_url=url
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    # Create Order
    order = models.Order(
        user_id=current_user.id,
        payment_id=payment.id,
        items_json=items_json,
        total_amount=amount,
        status="PENDIENTE"
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    return {"message": "Reporte de SINPE recibido para compra", "payment_id": payment.id, "order_id": order.id}
