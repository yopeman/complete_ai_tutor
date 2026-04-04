from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any
from app.database import get_db
from app.dependencies import get_current_active_user
from app.config import get_settings
from app.models import User, Payment, Course
from app.schemas.payment import PaymentResponse, ChapaCallback
from app.services.payment_service import PaymentService


router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/verify/{tx_ref}", response_model=PaymentResponse)
async def verify_payment(
    tx_ref: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    settings = Depends(get_settings)
):
    """Verify a payment status with Chapa."""
    # Find the payment record
    result = await db.execute(select(Payment).where(Payment.tx_ref == tx_ref, Payment.user_id == current_user.id))
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment record not found"
        )
    
    # Check with Chapa
    payment_service = PaymentService(chapa_api_key=settings.chapa_api_key)
    verification = payment_service.verify_payment(tx_ref)
    
    if verification.status == "success":
        payment.status = "COMPLETED"
        payment.payment_data = verification.data.model_dump() if verification.data else None
        await db.commit()
        await db.refresh(payment)
    elif verification.status == "failed":
        payment.status = "FAILED"
        await db.commit()
        await db.refresh(payment)
        
    return payment


@router.get("/callback")
async def payment_webhook(
    status: str = None,
    trx_ref: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Handle Chapa webhook callback."""
    print(f"Received Chapa webhook: status={status}, trx_ref={trx_ref}")
    
    if not trx_ref:
        return {"status": "error", "message": "Missing trx_ref"}
    
    # Find the payment record
    result = await db.execute(select(Payment).where(Payment.tx_ref == trx_ref))
    payment = result.scalar_one_or_none()

    print("Payment found: ", payment)
    
    if payment:
        if status == "success":
            payment.status = "COMPLETED"
        else:
            payment.status = "FAILED"
        
        # Store metadata about the update
        payment.payment_data = {"webhook_status": status, "trx_ref": trx_ref}
        await db.commit()
        
    return {"status": "ok"}


@router.get("", response_model=List[PaymentResponse])
async def list_payments(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List all payments for the current user."""
    result = await db.execute(select(Payment).where(Payment.user_id == current_user.id).order_by(Payment.created_at.desc()))
    payments = result.scalars().all()
    return payments


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific payment record."""
    result = await db.execute(select(Payment).where(Payment.id == payment_id, Payment.user_id == current_user.id))
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment record not found"
        )
    
    return payment
