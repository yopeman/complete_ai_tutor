from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.dependencies import get_current_active_user
from app.models import User
from app.schemas import FlashcardUpdate, FlashcardResponse
from app.controllers.flashcards import (
    get_flashcards as get_flashcards_controller,
    get_flashcard as get_flashcard_controller,
    update_flashcard as update_flashcard_controller,
    delete_flashcard as delete_flashcard_controller,
)

router = APIRouter(prefix="/flashcards", tags=["Flashcards"])


@router.get("", response_model=List[FlashcardResponse])
async def get_flashcards(
    lesson_id: int = Query(None, description="Filter by lesson ID"),
    difficulty: str = Query(None, description="Filter by difficulty"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all flashcards for the current user."""
    return await get_flashcards_controller(lesson_id, difficulty, skip, limit, current_user, db)


@router.get("/{flashcard_id}", response_model=FlashcardResponse)
async def get_flashcard(
    flashcard_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific flashcard by ID."""
    return await get_flashcard_controller(flashcard_id, current_user, db)


@router.put("/{flashcard_id}", response_model=FlashcardResponse)
async def update_flashcard(
    flashcard_id: int,
    flashcard_data: FlashcardUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a flashcard."""
    return await update_flashcard_controller(flashcard_id, flashcard_data, current_user, db)


@router.delete("/{flashcard_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_flashcard(
    flashcard_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a flashcard."""
    return await delete_flashcard_controller(flashcard_id, current_user, db)
