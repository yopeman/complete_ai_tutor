from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.dependencies import get_current_active_user
from app.models import User, Flashcard, Lesson, Course
from app.schemas import FlashcardUpdate, FlashcardResponse


async def verify_flashcard_access(flashcard_id: int, user_id: int, db: AsyncSession):
    """Verify that a flashcard belongs to the user's course."""
    result = await db.execute(
        select(Flashcard)
        .join(Lesson)
        .join(Course)
        .where(Flashcard.id == flashcard_id, Course.user_id == user_id)
    )
    flashcard = result.scalar_one_or_none()
    
    if not flashcard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flashcard not found"
        )
    
    return flashcard


async def get_flashcards(
    lesson_id: int = Query(None, description="Filter by lesson ID"),
    difficulty: str = Query(None, description="Filter by difficulty"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all flashcards for the current user."""
    query = (
        select(Flashcard)
        .join(Lesson)
        .join(Course)
        .where(Course.user_id == current_user.id)
    )
    
    if lesson_id:
        query = query.where(Flashcard.lesson_id == lesson_id)
    
    if difficulty:
        query = query.where(Flashcard.difficulty == difficulty)
    
    query = query.order_by(Flashcard.created_at).offset(skip).limit(limit)
    
    result = await db.execute(query)
    flashcards = result.scalars().all()
    
    return flashcards


async def get_flashcard(
    flashcard_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific flashcard by ID."""
    flashcard = await verify_flashcard_access(flashcard_id, current_user.id, db)
    return flashcard


async def update_flashcard(
    flashcard_id: int,
    flashcard_data: FlashcardUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a flashcard."""
    flashcard = await verify_flashcard_access(flashcard_id, current_user.id, db)
    
    update_data = flashcard_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(flashcard, field, value)
    
    await db.commit()
    await db.refresh(flashcard)
    
    return flashcard


async def delete_flashcard(
    flashcard_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a flashcard."""
    flashcard = await verify_flashcard_access(flashcard_id, current_user.id, db)
    
    await db.delete(flashcard)
    await db.commit()
    
    return None
