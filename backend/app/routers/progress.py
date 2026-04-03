from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.dependencies import get_current_active_user
from app.models import User, Progress, Lesson, Course
from app.schemas import ProgressUpdate, ProgressResponse
from app.controllers.progress import (
    get_progress as get_progress_controller,
    get_progress_by_id as get_progress_by_id_controller,
)

router = APIRouter(prefix="/progress", tags=["Progress"])


@router.get("", response_model=List[ProgressResponse])
async def get_progress(
    lesson_id: int = Query(None, description="Filter by lesson ID"),
    is_passed: bool = Query(None, description="Filter by pass status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all progress records for current user."""
    return await get_progress_controller(lesson_id, is_passed, skip, limit, current_user, db)


@router.get("/{progress_id}", response_model=ProgressResponse)
async def get_progress_by_id(
    progress_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific progress record by ID."""
    return await get_progress_by_id_controller(progress_id, current_user, db)
