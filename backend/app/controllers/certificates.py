from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import defer
from fastapi import HTTPException, status
from app.models import Certificate, User
from typing import List


async def get_certificates(
    current_user: User,
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100
):
    """Fetch all stored certificates for the current user."""
    query = select(Certificate).options(defer(Certificate.content)).where(Certificate.user_id == current_user.id).order_by(desc(Certificate.issue_date)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def get_certificate(
    certificate_id: int,
    current_user: User,
    db: AsyncSession
):
    """Fetch a specific certificate by ID."""
    result = await db.execute(
        select(Certificate).where(Certificate.id == certificate_id, Certificate.user_id == current_user.id)
    )
    certificate = result.scalar_one_or_none()
    
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate not found"
        )
    
    return certificate
