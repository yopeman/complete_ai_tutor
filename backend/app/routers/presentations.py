from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.dependencies import get_current_active_user
from app.models import User
from app.schemas.presentation import PresentationResponse
from app.controllers.presentations import (
    get_presentations as get_presentations_controller,
    get_presentation_by_id as get_presentation_by_id_controller,
)


router = APIRouter(prefix="/presentations", tags=["Presentations"])


@router.get("", response_model=List[PresentationResponse])
async def get_presentations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all presentations belonging to the current user."""
    return await get_presentations_controller(current_user, db, skip, limit)


@router.get("/{presentation_id}", response_model=PresentationResponse)
async def get_presentation_by_id(
    presentation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve a specific presentation by ID."""
    return await get_presentation_by_id_controller(presentation_id, current_user, db)
