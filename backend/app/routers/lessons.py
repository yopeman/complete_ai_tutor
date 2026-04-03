from fastapi import APIRouter, Depends, Query, status, Form, File, UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.tts_and_stt import transcribe_uploaded_file
from sqlalchemy import select
from typing import List, Optional
from app.database import get_db
from app.dependencies import get_current_active_user
from app.config import get_settings
from app.models import User, Lesson, Course, Interaction, Quiz, Progress, Flashcard
from app.schemas import (
    LessonUpdate,
    LessonResponse,
    InteractionCreate,
    InteractionResponse,
    QuizCreate,
    QuizUpdate,
    QuizResponse,
    QuizBatchSubmission,
    QuizEvaluationResult,
    ProgressCreate,
    ProgressUpdate,
    ProgressResponse,
    FlashcardCreate,
    FlashcardResponse,
)
from app.controllers.lessons import (
    get_lesson as get_lesson_controller,
    complete_lesson as complete_lesson_controller,
    get_lesson_interactions as get_lesson_interactions_controller,
    create_interaction as create_interaction_controller,
    get_lesson_quizzes as get_lesson_quizzes_controller,
    submit_quizzes as submit_quizzes_controller,
    get_lesson_progress as get_lesson_progress_controller,
    get_lesson_flashcards as get_lesson_flashcards_controller,
)

router = APIRouter(prefix="/lessons", tags=["Lessons"])


@router.get("/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    lesson_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    settings = Depends(get_settings)
):
    """Get a specific lesson by ID. Generates content if missing."""
    return await get_lesson_controller(lesson_id, current_user, db, settings)

@router.get("/{lesson_id}/complete", response_model=List[QuizResponse])
async def complete_lesson(
    lesson_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    settings = Depends(get_settings)
):
    """Mark a lesson as complete and generate quizzes for evaluation."""
    return await complete_lesson_controller(lesson_id, current_user, db, settings)

# ============== Interactions Endpoints ==============

@router.get("/{lesson_id}/interactions", response_model=List[InteractionResponse])
async def get_lesson_interactions(
    lesson_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all interactions for a lesson."""
    return await get_lesson_interactions_controller(lesson_id, skip, limit, current_user, db)


@router.post("/{lesson_id}/interactions", response_model=InteractionResponse, status_code=status.HTTP_201_CREATED)
async def create_interaction(
    lesson_id: int,
    user_question: Optional[str] = Form(None),
    audio_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    settings = Depends(get_settings)
):
    """Create a new interaction for a lesson where TutorAgent answers a student question."""
    if not user_question and not audio_file:
        raise HTTPException(status_code=400, detail="Either user_question or audio_file must be provided")
    
    if not user_question and audio_file:
        user_question = await transcribe_uploaded_file(audio_file)
        
    interaction_data = InteractionCreate(user_question=user_question)
    return await create_interaction_controller(lesson_id, interaction_data, current_user, db, settings)


# ============== Quizzes Endpoints ==============

@router.get("/{lesson_id}/quizzes", response_model=List[QuizResponse])
async def get_lesson_quizzes(
    lesson_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all quizzes for a lesson."""
    return await get_lesson_quizzes_controller(lesson_id, current_user, db)

@router.post("/{lesson_id}/quizzes/submit", response_model=QuizEvaluationResult)
async def submit_quizzes(
    lesson_id: int,
    submission: QuizBatchSubmission,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit quiz answers for evaluation."""
    return await submit_quizzes_controller(lesson_id, submission, current_user, db)

# ============== Progress Endpoints ==============

@router.get("/{lesson_id}/progress", response_model=List[ProgressResponse])
async def get_lesson_progress(
    lesson_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all progress records for a lesson."""
    return await get_lesson_progress_controller(lesson_id, current_user, db)


# ============== Flashcards Endpoints ==============

@router.get("/{lesson_id}/flashcards", response_model=List[FlashcardResponse])
async def get_lesson_flashcards(
    lesson_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all flashcards for a lesson."""
    return await get_lesson_flashcards_controller(lesson_id, current_user, db)
