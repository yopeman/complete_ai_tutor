from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.dependencies import get_current_active_user
from app.models import User, Quiz, Lesson, Course
from app.schemas import QuizUpdate, QuizResponse
from app.controllers.quizzes import (
    get_quizzes as get_quizzes_controller,
    get_quiz as get_quiz_controller,
)

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


@router.get("", response_model=List[QuizResponse])
async def get_quizzes(
    lesson_id: int = Query(None, description="Filter by lesson ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all quizzes for current user."""
    return await get_quizzes_controller(lesson_id, skip, limit, current_user, db)


@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific quiz by ID."""
    return await get_quiz_controller(quiz_id, current_user, db)
