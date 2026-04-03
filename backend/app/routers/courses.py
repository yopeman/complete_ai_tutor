from fastapi import APIRouter, Depends, status, Query, Form, File, UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.tts_and_stt import transcribe_uploaded_file
from typing import List, Optional
from app.database import get_db
from app.dependencies import get_current_active_user
from app.models import User
from app.schemas import (
    CourseCreate,
    CourseUpdate,
    CoursePlanUpdate,
    CourseResponse,
    CourseListResponse,
    LessonCreate,
    LessonResponse,
    LessonListResponse,
    ChatCreate,
    ChatResponse,
    ChatWithCourseResponse,
)
from app.controllers.courses import (
    create_course as create_course_controller,
    get_courses as get_courses_controller,
    get_course as get_course_controller,
    update_course_plan_ai as update_course_plan_ai_controller,
    update_course_plan_direct as update_course_plan_direct_controller,
    delete_course as delete_course_controller,
    install_course_plan as install_course_plan_controller,
    get_course_lessons as get_course_lessons_controller,
)

router = APIRouter(prefix="/courses", tags=["Courses"])


# ..._@
@router.post("", response_model=ChatWithCourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    prompt: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    audio_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new course using the Initialize Agent."""
    if not prompt and not audio_file:
        raise HTTPException(status_code=400, detail="Either prompt or audio_file must be provided")
    
    if not prompt and audio_file:
        prompt = await transcribe_uploaded_file(audio_file)
        
    chat_data = ChatCreate(prompt=prompt, session_id=session_id)
    return await create_course_controller(chat_data, current_user, db)


@router.get("", response_model=List[CourseListResponse])
async def get_courses(
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all courses for the current user."""
    return await get_courses_controller(status, skip, limit, current_user, db)


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific course by ID."""
    return await get_course_controller(course_id, current_user, db)

# ..._@
@router.put("/{course_id}/plans/ai", response_model=CourseResponse)
async def update_course_plan_ai(
    course_id: int,
    prompt: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    audio_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a course plan by using prompt and AI."""
    if not prompt and not audio_file:
        raise HTTPException(status_code=400, detail="Either prompt or audio_file must be provided")
    
    if not prompt and audio_file:
        prompt = await transcribe_uploaded_file(audio_file)
        
    chat_data = ChatCreate(prompt=prompt, session_id=session_id)
    return await update_course_plan_ai_controller(course_id, chat_data, current_user, db)


@router.put("/{course_id}/plans/direct", response_model=CourseResponse)
async def update_course_plan_direct(
    course_id: int,
    course_data: CoursePlanUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Directly update the plan manually."""
    return await update_course_plan_direct_controller(course_id, course_data, current_user, db)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a course."""
    return await delete_course_controller(course_id, current_user, db)


# ============== Lessons Endpoints ==============

@router.post("/{course_id}/install", response_model=List[LessonListResponse])
async def install_course_plan(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create lessons from course_plan using AI extraction."""
    return await install_course_plan_controller(course_id, current_user, db)

@router.get("/{course_id}/lessons", response_model=List[LessonListResponse])
async def get_course_lessons(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all lessons for a specific course."""
    return await get_course_lessons_controller(course_id, current_user, db)
