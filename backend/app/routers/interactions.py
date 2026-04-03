from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.dependencies import get_current_active_user
from app.models import User, Interaction, Lesson, Course
from app.schemas import InteractionCreate, InteractionResponse
from app.controllers.interactions import (
    get_interactions as get_interactions_controller,
    get_interaction as get_interaction_controller,
)

router = APIRouter(prefix="/interactions", tags=["Interactions"])


@router.get("", response_model=List[InteractionResponse])
async def get_interactions(
    lesson_id: int = Query(None, description="Filter by lesson ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all interactions for current user."""
    return await get_interactions_controller(lesson_id, skip, limit, current_user, db)


@router.get("/{interaction_id}", response_model=InteractionResponse)
async def get_interaction(
    interaction_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific interaction by ID."""
    return await get_interaction_controller(interaction_id, current_user, db)
