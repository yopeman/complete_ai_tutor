from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.dependencies import get_current_active_user
from app.models import User, Progress, Lesson, Course
from app.schemas import ProgressUpdate, ProgressResponse


async def verify_progress_access(progress_id: int, user_id: int, db: AsyncSession) -> Progress:
    """Verify that a progress record belongs to the user's course."""
    result = await db.execute(
        select(Progress)
        .join(Lesson)
        .join(Course)
        .where(Progress.id == progress_id, Course.user_id == user_id)
    )
    progress = result.scalar_one_or_none()
    
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Progress record not found"
        )
    
    return progress


async def get_progress(
    lesson_id: int = Query(None, description="Filter by lesson ID"),
    is_passed: bool = Query(None, description="Filter by pass status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all progress records for the current user."""
    query = (
        select(Progress)
        .join(Lesson)
        .join(Course)
        .where(Course.user_id == current_user.id)
    )
    
    if lesson_id:
        query = query.where(Progress.lesson_id == lesson_id)
    
    if is_passed is not None:
        query = query.where(Progress.is_passed == is_passed)
    
    query = query.order_by(Progress.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    progress_records = result.scalars().all()
    
    return progress_records


async def get_progress_by_id(
    progress_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific progress record by ID."""
    progress = await verify_progress_access(progress_id, current_user.id, db)
    return progress
