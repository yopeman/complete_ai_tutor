from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Lesson, Presentation, User
from app.services.ppt_agent import PPTAgent
from app.schemas.presentation import PresentationResponse


async def verify_lesson_access(lesson_id: int, user_id: int, db: AsyncSession) -> Lesson:
    """Verify that a lesson belongs to the user's course."""
    from app.models import Course
    result = await db.execute(
        select(Lesson)
        .join(Course)
        .where(Lesson.id == lesson_id, Course.user_id == user_id)
    )
    lesson = result.scalar_one_or_none()
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    return lesson


async def get_or_create_presentation(
    lesson_id: int,
    current_user: User,
    db: AsyncSession
):
    """Retrieve an existing presentation for a lesson, or generate it if it doesn't exist."""
    lesson = await verify_lesson_access(lesson_id, current_user.id, db)
    
    # 1. Check if presentation already exists
    result = await db.execute(
        select(Presentation).where(Presentation.lesson_id == lesson_id)
    )
    presentation = result.scalar_one_or_none()
    
    if presentation:
        return presentation
        
    # 2. If not exists, generate it
    if not lesson.content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lesson content is missing. Please generate lesson content first (by visiting the lesson)."
        )
    
    ppt_agent = PPTAgent(db=db, user_id=current_user.id)
    ppt_instance = await ppt_agent.generate_presentation(lesson_id=lesson_id)
    
    if not ppt_instance:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate presentation"
        )
    
    # 3. Reload from DB to get the presentation object with ID and timestamps
    result = await db.execute(
        select(Presentation).where(Presentation.lesson_id == lesson_id)
    )
    return result.scalar_one()


async def get_presentations(
    current_user: User,
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100
):
    """Retrieve all presentations belonging to the current user."""
    from app.models import Lesson, Course
    result = await db.execute(
        select(Presentation)
        .join(Lesson)
        .join(Course)
        .where(Course.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


async def get_presentation_by_id(
    presentation_id: int,
    current_user: User,
    db: AsyncSession
):
    """Retrieve a specific presentation by its ID."""
    from app.models import Lesson, Course
    result = await db.execute(
        select(Presentation)
        .join(Lesson)
        .join(Course)
        .where(Presentation.id == presentation_id, Course.user_id == current_user.id)
    )
    presentation = result.scalar_one_or_none()
    
    if not presentation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Presentation not found"
        )
    
    return presentation


