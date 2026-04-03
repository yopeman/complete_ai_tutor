from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from app.models.enums import QuizType


class Quiz(Base):
    __tablename__ = "quizzes"
    
    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String(100), nullable=True)
    question = Column(Text, nullable=False)
    options = Column(JSON, default=list)
    explanation = Column(Text, nullable=True)
    correct_answer = Column(String(500), nullable=True)
    student_answer = Column(String(500), nullable=True)
    is_correct = Column(Boolean, nullable=True)
    type = Column(Enum(QuizType), default=QuizType.MULTIPLE_CHOICE)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    lesson = relationship("Lesson", back_populates="quizzes")
