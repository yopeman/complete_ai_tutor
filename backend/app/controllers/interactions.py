from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.dependencies import get_current_active_user
from app.models import User, Interaction, Lesson, Course
from app.schemas import InteractionCreate, InteractionResponse


async def verify_interaction_access(interaction_id: int, user_id: int, db: AsyncSession) -> Interaction:
    """Verify that an interaction belongs to the user's course."""
    result = await db.execute(
        select(Interaction)
        .join(Lesson)
        .join(Course)
        .where(Interaction.id == interaction_id, Course.user_id == user_id)
    )
    interaction = result.scalar_one_or_none()
    
    if not interaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interaction not found"
        )
    
    return interaction


async def get_interactions(
    lesson_id: int = Query(None, description="Filter by lesson ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all interactions for the current user."""
    query = (
        select(Interaction)
        .join(Lesson)
        .join(Course)
        .where(Course.user_id == current_user.id)
    )
    
    if lesson_id:
        query = query.where(Interaction.lesson_id == lesson_id)
    
    query = query.order_by(Interaction.created_at).offset(skip).limit(limit)
    
    result = await db.execute(query)
    interactions = result.scalars().all()
    
    return interactions


async def get_interaction(
    interaction_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific interaction by ID."""
    interaction = await verify_interaction_access(interaction_id, current_user.id, db)
    return interaction
