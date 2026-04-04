from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.dependencies import get_current_active_user
from app.models import User
from app.schemas import CertificateResponse, CertificateListResponse
from app.controllers.certificates import (
    get_certificates as get_certificates_controller,
    get_certificate as get_certificate_controller,
)


router = APIRouter(prefix="/certificates", tags=["Certificates"])


@router.get("", response_model=List[CertificateListResponse])
async def get_certificates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch all stored certificates for the current user."""
    return await get_certificates_controller(current_user, db, skip, limit)


@router.get("/{certificate_id}", response_model=CertificateResponse)
async def get_certificate(
    certificate_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetch a specific certificate by ID."""
    return await get_certificate_controller(certificate_id, current_user, db)
