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
import math
import uuid
from app.models import Payment
from app.models.enums import LessonStatus
from app.services.payment_service import PaymentService


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
    """Get a specific lesson by ID. Generates content if missing. Enforces 10% payment limit."""
    lesson = await verify_lesson_access(lesson_id, current_user.id, db)
    
    # Check if this course is already paid for by the current user
    result_payment = await db.execute(
        select(Payment).where(
            Payment.course_id == lesson.course_id,
            Payment.user_id == current_user.id,
            Payment.status == "COMPLETED"
        )
    )
    is_paid = result_payment.scalar_one_or_none() is not None
    
    if not is_paid:
        # Get all lessons for this course to calculate percentage
        result_all_lessons = await db.execute(
            select(Lesson).where(Lesson.course_id == lesson.course_id)
        )
        all_lessons = result_all_lessons.scalars().all()
        total_lessons = len(all_lessons)
        
        # Count lessons already accessed (status not NOT_STARTED)
        accessed_lessons = [l for l in all_lessons if l.status != LessonStatus.NOT_STARTED]
        accessed_count = len(accessed_lessons)
        
        # Free limit is 10% of total lessons
        free_limit = math.ceil(0.1 * total_lessons) if total_lessons > 0 else 0
        
        # If this is a new lesson (NOT_STARTED) and user has reached the free limit
        if lesson.status == LessonStatus.NOT_STARTED and accessed_count >= free_limit:
            # Payment required - trigger Chapa initialization
            payment_service = PaymentService(chapa_api_key=settings.chapa_api_key)
            tx_ref = f"TX-{current_user.id}-{lesson.course_id}-{uuid.uuid4().hex[:8]}"
            
            # Check for existing PENDING payment to reuse tx_ref
            result_pending = await db.execute(
                select(Payment).where(
                    Payment.course_id == lesson.course_id,
                    Payment.user_id == current_user.id,
                    Payment.status == "PENDING"
                )
            )

            existing_payment = result_pending.scalar_one_or_none()
            
            # Initialize payment with Chapa
            payment_response = payment_service.accept_payment(
                amount=100.0, # Fixed price
                currency='ETB',
                first_name=current_user.username,
                tx_ref=tx_ref,
                callback_url=f"{settings.backend_base_url}/payments/callback",
                return_url=f"{settings.frontend_base_url}/courses/{lesson.course_id}"
            )
            
            if payment_response.status == "success" and payment_response.data:
                new_payment = Payment(
                    user_id=current_user.id,
                    course_id=lesson.course_id,
                    tx_ref=tx_ref,
                    amount=100.0,
                    status="PENDING"
                )
                db.add(new_payment)
                await db.commit()
                
                # Return 402 with checkout URL
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail={
                        "message": f"Free lesson limit ({free_limit} lessons) reached. Please complete the payment to continue.",
                        "checkout_url": payment_response.data.checkout_url
                    }
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Payment initialization failed: {payment_response.message}"
                )

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

    for quiz in quizzes:
        quiz.explanation = None
        quiz.correct_answer = None
        quiz.is_correct = None
    
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
