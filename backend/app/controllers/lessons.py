from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.database import get_db
from app.dependencies import get_current_active_user
from app.config import get_settings
from app.services.tutor_agent import TutorAgent
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


async def verify_lesson_access(lesson_id: int, user_id: int, db: AsyncSession) -> Lesson:
    """Verify that a lesson belongs to the user's course."""
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


async def get_lesson(
    lesson_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    settings = Depends(get_settings)
):
    """Get a specific lesson by ID. Generates content if missing."""
    lesson = await verify_lesson_access(lesson_id, current_user.id, db)
    
    # If the lesson doesn't have content, generate it using the TutorAgent
    if not lesson.content or not lesson.daily_plan:
        tutor_agent = TutorAgent(
            db=db,
            user_id=current_user.id
        )
        # generate_lesson_content handles the DB update internally via its tool
        await tutor_agent.generate_lesson_content(lesson_id=lesson.id)
        
        # Refresh to get the updated content
        await db.refresh(lesson)
    
    return lesson

async def complete_lesson(
    lesson_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    settings = Depends(get_settings)
):
    """Mark a lesson as complete and generate quizzes for evaluation."""
    lesson = await verify_lesson_access(lesson_id, current_user.id, db)
    
    tutor_agent = TutorAgent(
        db=db,
        user_id=current_user.id
    )
    
    # Generate quizzes for the lesson
    quizzes = await tutor_agent.generate_lesson_quizzes(lesson_id=lesson.id)
    
    if not quizzes:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate quizzes for the lesson"
        )
    
    return quizzes

# ============== Interactions Endpoints ==============

async def get_lesson_interactions(
    lesson_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all interactions for a lesson."""
    await verify_lesson_access(lesson_id, current_user.id, db)
    
    result = await db.execute(
        select(Interaction)
        .where(Interaction.lesson_id == lesson_id)
        .order_by(Interaction.created_at)
        .offset(skip)
        .limit(limit)
    )
    interactions = result.scalars().all()
    
    return interactions


async def create_interaction(
    lesson_id: int,
    interaction_data: InteractionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    settings = Depends(get_settings)
):
    """Create a new interaction for a lesson where the TutorAgent answers a student question."""
    await verify_lesson_access(lesson_id, current_user.id, db)
    
    tutor_agent = TutorAgent(
        db=db,
        user_id=current_user.id
    )
    
    # Generate the AI answer using the TutorAgent
    ai_answer = await tutor_agent.ask_tutor(
        lesson_id=lesson_id,
        question=interaction_data.user_question
    )
    
    # Save the interaction to the database
    db_interaction = Interaction(
        lesson_id=lesson_id,
        user_question=interaction_data.user_question,
        ai_answer=ai_answer
    )
    
    db.add(db_interaction)
    await db.commit()
    await db.refresh(db_interaction)
    
    return db_interaction


# ============== Quizzes Endpoints ==============

async def get_lesson_quizzes(
    lesson_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all quizzes for a lesson."""
    await verify_lesson_access(lesson_id, current_user.id, db)
    
    result = await db.execute(
        select(Quiz).where(Quiz.lesson_id == lesson_id).order_by(Quiz.created_at)
    )
    quizzes = result.scalars().all()
    
    return quizzes

async def submit_quizzes(
    lesson_id: int,
    submission: QuizBatchSubmission,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    settings = Depends(get_settings)
):
    """Submit quiz answers for evaluation."""
    await verify_lesson_access(lesson_id, current_user.id, db)
    
    tutor_agent = TutorAgent(
        db=db,
        user_id=current_user.id
    )
    
    # Convert list of submissions to a dict for easier processing
    student_submissions = {str(s.quiz_id): s.student_answer for s in submission.submissions}
    
    # Evaluate quizzes
    evaluation = await tutor_agent.evaluate_lesson_quizzes(
        lesson_id=lesson_id,
        session_id=submission.session_id,
        student_submissions=student_submissions
    )
    
    if "error" in evaluation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=evaluation["error"]
        )
    
    return evaluation

# ============== Progress Endpoints ==============

async def get_lesson_progress(
    lesson_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all progress records for a lesson."""
    await verify_lesson_access(lesson_id, current_user.id, db)
    
    result = await db.execute(
        select(Progress).where(Progress.lesson_id == lesson_id).order_by(Progress.created_at)
    )
    progress_records = result.scalars().all()
    
    return progress_records


# ============== Flashcards Endpoints ==============

async def get_lesson_flashcards(
    lesson_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all flashcards for a lesson."""
    await verify_lesson_access(lesson_id, current_user.id, db)
    
    result = await db.execute(
        select(Flashcard).where(Flashcard.lesson_id == lesson_id).order_by(Flashcard.created_at)
    )
    flashcards = result.scalars().all()
    
    return flashcards
