from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class QuizBase(BaseModel):
    session_id: Optional[str] = Field(None, max_length=100)
    question: str
    options: List[str] = Field(default_factory=list)
    correct_answer: Optional[str] = Field(None, max_length=500)
    student_answer: Optional[str] = Field(None, max_length=500)
    is_correct: Optional[bool] = None
    explanation: Optional[str] = Field(None)
    type: str = "multiple_choice"


class QuizCreate(QuizBase):
    pass


class QuizUpdate(BaseModel):
    student_answer: Optional[str] = Field(None, max_length=500)
    is_correct: Optional[bool] = None


class QuizResponse(QuizBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    lesson_id: int
    created_at: datetime


class QuizSubmission(BaseModel):
    quiz_id: int
    student_answer: str


class QuizBatchSubmission(BaseModel):
    session_id: str
    submissions: List[QuizSubmission]


class QuizEvaluationResult(BaseModel):
    score: int
    total_questions: int
    is_passed: bool
    feedback: str
    student_status: str
    quizzes: List[QuizResponse]
