from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import schemas, models, database
from auth import get_current_user

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

@router.get("/pending", response_model=List[schemas.PaymentOut])
def get_pending_payments(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """Endpoint para que el Súper Admin vea los pagos pendientes de aprobación"""
    # En producción: validar permisos de Admin aquí
    return db.query(models.Payment).filter(models.Payment.status == "PENDING").all()

@router.post("/{payment_id}/approve")
def approve_payment(payment_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """Endpoint para que el Admin apruebe un comprobante"""
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    
    payment.status = "APPROVED"
    db.commit()
    return {"message": "Pago aprobado", "payment_id": payment.id}

@router.post("/tilopay/init")
def init_tilopay_payment(amount: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    """Integración inicial con Tilopay (Mock)"""
    # Aquí iría el llamado real a la API de Tilopay para generar un link de pago
    return {
        "payment_url": "https://pay.tilopay.com/mock-link-1234",
        "message": "Redirigiendo a pasarela Tilopay..."
    }
