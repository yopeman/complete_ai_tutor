from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.dependencies import get_current_active_user
from app.models import User, Quiz, Lesson, Course
from app.schemas import QuizUpdate, QuizResponse

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


async def verify_quiz_access(quiz_id: int, user_id: int, db: AsyncSession) -> Quiz:
    """Verify that a quiz belongs to the user's course."""
    result = await db.execute(
        select(Quiz)
        .join(Lesson)
        .join(Course)
        .where(Quiz.id == quiz_id, Course.user_id == user_id)
    )
    quiz = result.scalar_one_or_none()
    
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    return quiz


@router.get("", response_model=List[QuizResponse])
async def get_quizzes(
    lesson_id: int = Query(None, description="Filter by lesson ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all quizzes for the current user."""
    query = (
        select(Quiz)
        .join(Lesson)
        .join(Course)
        .where(Course.user_id == current_user.id)
    )
    
    if lesson_id:
        query = query.where(Quiz.lesson_id == lesson_id)
    
    query = query.order_by(Quiz.created_at).offset(skip).limit(limit)
    
    result = await db.execute(query)
    quizzes = result.scalars().all()
    
    return quizzes


@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific quiz by ID."""
    quiz = await verify_quiz_access(quiz_id, current_user.id, db)
    return quiz
