# Import all models for backward compatibility
from app.models.enums import CourseStatus, LessonStatus, QuizType
from app.models.user import User
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.interaction import Interaction
from app.models.quiz import Quiz
from app.models.progress import Progress
from app.models.flashcard import Flashcard
from app.models.chat import Chat
from app.models.presentation import Presentation


# Export all models
__all__ = [
    'CourseStatus', 'LessonStatus', 'QuizType',
    'User', 'Course', 'Lesson', 'Interaction', 
    'Quiz', 'Progress', 'Flashcard', 'Chat', 'Presentation'
]

