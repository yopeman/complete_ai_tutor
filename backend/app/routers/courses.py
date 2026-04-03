from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
from app.database import get_db
from app.dependencies import get_current_active_user
from app.models import User, Course, Lesson, CourseStatus, Chat
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
from app.services.architect_agent import ArchitectAgent
from app.config import get_llm

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.post("", response_model=ChatWithCourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    chat_data: ChatCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new course using the Initialize Agent."""
    try:
        # Initialize architect agent
        architect = ArchitectAgent(
            db=db,
            user_id=current_user.id
        )
        
        # Process user prompt with agent
        result = await architect.process_prompt(
            prompt=chat_data.prompt,
            session_id=chat_data.session_id
        )
        
        # Get course if it was created
        course = result.get("course")
        
        # Save the chat interaction
        chat = Chat(
            user_id=current_user.id,
            session_id=result["session_id"],
            prompt=chat_data.prompt,
            response=result["response"]
        )
        db.add(chat)
        await db.commit()
        await db.refresh(chat)
        
        # Prepare response with optional course
        course_response = CourseResponse.model_validate(course) if course else None
        response_data = ChatWithCourseResponse(
            id=chat.id,
            user_id=chat.user_id,
            session_id=chat.session_id,
            prompt=chat.prompt,
            response=chat.response,
            created_at=chat.created_at,
            course=course_response.model_dump() if course_response else None
        )
        
        return response_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing course creation: {str(e)}"
        )


@router.get("", response_model=List[CourseListResponse])
async def get_courses(
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all courses for the current user."""
    query = select(Course).where(Course.user_id == current_user.id)
    
    if status:
        query = query.where(Course.status == status)
    
    query = query.order_by(desc(Course.created_at)).offset(skip).limit(limit)
    
    result = await db.execute(query)
    courses = result.scalars().all()
    
    return courses


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific course by ID."""
    result = await db.execute(
        select(Course).where(Course.id == course_id, Course.user_id == current_user.id)
    )
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    return course

@router.put("/{course_id}/plans/ai", response_model=CourseResponse)
async def update_course_plan_ai(
    course_id: int,
    chat_data: ChatCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a course plan by using prompt and AI."""
    result = await db.execute(
        select(Course).where(Course.id == course_id, Course.user_id == current_user.id)
    )
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    
    from langchain_core.messages import SystemMessage, HumanMessage
    import uuid
    
    llm = get_llm()
    
    system_message = (
        "You are an expert educational content designer. Your task is to update "
        "an existing course plan based on the user's instructions. "
        "Return ONLY the updated course plan in markdown format. Do not include any extra conversational text."
    )
    
    human_message = (
        f"Current course plan:\n{course.course_plan or 'No existing plan.'}\n\n"
        f"User instruction for update:\n{chat_data.prompt}"
    )
    
    try:
        response = await llm.ainvoke([
            SystemMessage(content=system_message),
            HumanMessage(content=human_message)
        ])
        updated_plan = response.content
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating course plan with AI: {str(e)}"
        )
        
    course.course_plan = updated_plan
    
    # Save the interaction to chat history
    session_id = chat_data.session_id or str(uuid.uuid4())
    chat = Chat(
        user_id=current_user.id,
        session_id=session_id,
        prompt=chat_data.prompt,
        response="Course plan updated successfully based on your instructions."
    )
    db.add(chat)
    await db.commit()
    await db.refresh(course)
    
    return course


@router.put("/{course_id}/plans/direct", response_model=CourseResponse)
async def update_course_plan_direct(
    course_id: int,
    course_data: CoursePlanUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Directly update the plan manually."""
    result = await db.execute(
        select(Course).where(Course.id == course_id, Course.user_id == current_user.id)
    )
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )

    if course_data.course_plan is not None:
        course.course_plan = course_data.course_plan
        await db.commit()
        await db.refresh(course)

    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a course."""
    result = await db.execute(
        select(Course).where(Course.id == course_id, Course.user_id == current_user.id)
    )
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    await db.delete(course)
    await db.commit()
    
    return None


# ============== Lessons Endpoints ==============

@router.post("/{course_id}/install", response_model=List[LessonListResponse])
async def install_course_plan(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create lessons from course_plan using AI extraction."""
    from sqlalchemy import delete
    
    # Verify course belongs to user
    result = await db.execute(
        select(Course).where(Course.id == course_id, Course.user_id == current_user.id)
    )
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
        
    if not course.course_plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course plan is empty"
        )
        
    from langchain_core.messages import SystemMessage, HumanMessage
    from pydantic import BaseModel, Field
    
    class LessonExtraction(BaseModel):
        day_number: int = Field(description="The day number of the lesson")
        title: str = Field(description="The title of the lesson")
        description: str = Field(description="A brief description of what will be covered in the lesson")

    class LessonsExtraction(BaseModel):
        lessons: List[LessonExtraction]
        
    llm = get_llm()
    
    structured_llm = llm.with_structured_output(LessonsExtraction)
    
    system_message = (
        "You are an expert AI instructional assistant. "
        "Your task is to extract lessons from the provided course plan. "
        "Extract the day number, title, and description for each lesson exactly as they appear in the plan."
    )
    
    try:
        extraction_result = await structured_llm.ainvoke([
            SystemMessage(content=system_message),
            HumanMessage(content=course.course_plan)
        ])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error extracting lessons from course plan: {str(e)}"
        )
        
    if not extraction_result or not hasattr(extraction_result, 'lessons'):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to extract valid lesson format."
        )
        
    # Remove existing lessons to avoid duplication if reinstalling
    await db.execute(delete(Lesson).where(Lesson.course_id == course_id))
    
    for lesson_data in extraction_result.lessons:
        new_lesson = Lesson(
            course_id=course_id,
            day_number=lesson_data.day_number,
            title=lesson_data.title,
            description=lesson_data.description
        )
        db.add(new_lesson)
        
    await db.commit()
    
    # Fetch the newly created lessons
    lessons_result = await db.execute(
        select(Lesson).where(Lesson.course_id == course_id).order_by(Lesson.day_number)
    )
    created_lessons = lessons_result.scalars().all()
    
    return created_lessons

@router.get("/{course_id}/lessons", response_model=List[LessonListResponse])
async def get_course_lessons(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all lessons for a specific course."""
    # Verify course belongs to user
    result = await db.execute(
        select(Course).where(Course.id == course_id, Course.user_id == current_user.id)
    )
    course = result.scalar_one_or_none()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    lessons_result = await db.execute(
        select(Lesson).where(Lesson.course_id == course_id).order_by(Lesson.day_number)
    )
    lessons = lessons_result.scalars().all()
    
    return lessons
