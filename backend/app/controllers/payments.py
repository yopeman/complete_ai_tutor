from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.dependencies import get_current_active_user
from app.config import get_settings
from app.models import User, Payment
from app.schemas.payment import PaymentResponse
from app.services.payment_service import PaymentService


async def verify_payment_access(payment_id: int, user_id: int, db: AsyncSession) -> Payment:
    """Verify that a payment record belongs to the user."""
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id, Payment.user_id == user_id)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment record not found"
        )
    
    return payment


async def verify_payment_by_tx_ref(tx_ref: str, user_id: int, db: AsyncSession) -> Payment:
    """Verify that a payment record with tx_ref belongs to the user."""
    result = await db.execute(
        select(Payment).where(Payment.tx_ref == tx_ref, Payment.user_id == user_id)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment record not found"
        )
    
    return payment


async def verify_payment(
    tx_ref: str,
    current_user: User,
    db: AsyncSession,
    settings
):
    """Verify a payment status with Chapa."""
    payment = await verify_payment_by_tx_ref(tx_ref, current_user.id, db)
    
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


async def payment_webhook(
    status: str = None,
    trx_ref: str = None,
    db: AsyncSession = None
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


async def list_payments(
    current_user: User,
    db: AsyncSession
):
    """List all payments for the current user."""
    result = await db.execute(
        select(Payment)
        .where(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
    )
    payments = result.scalars().all()
    return payments


async def get_payment(
    payment_id: int,
    current_user: User,
    db: AsyncSession
):
    """Get a specific payment record."""
    payment = await verify_payment_access(payment_id, current_user.id, db)
    return payment
