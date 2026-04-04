from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.dependencies import get_current_active_user
from app.config import get_settings
from app.models import User
from app.schemas.payment import PaymentResponse
from app.controllers.payments import (
    verify_payment as verify_payment_controller,
    payment_webhook as payment_webhook_controller,
    list_payments as list_payments_controller,
    get_payment as get_payment_controller,
)


router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/verify/{tx_ref}", response_model=PaymentResponse)
async def verify_payment(
    tx_ref: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    settings = Depends(get_settings)
):
    """Verify a payment status with Chapa."""
    return await verify_payment_controller(tx_ref, current_user, db, settings)


@router.get("/callback")
async def payment_webhook(
    status: str = None,
    trx_ref: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Handle Chapa webhook callback."""
    return await payment_webhook_controller(status, trx_ref, db)


@router.get("", response_model=List[PaymentResponse])
async def list_payments(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List all payments for the current user."""
    return await list_payments_controller(current_user, db)


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific payment record."""
    return await get_payment_controller(payment_id, current_user, db)
