# Import all schemas for backward compatibility
from app.schemas.user import (
    UserBase, UserCreate, UserUpdate, UserResponse, UserInDB
)
from app.schemas.token import (
    Token, TokenPayload, TokenRefresh
)
from app.schemas.course import (
    CourseBase, CourseCreate, CourseUpdate, CoursePlanUpdate, CourseResponse, CourseListResponse
)
from app.schemas.lesson import (
    LessonBase, LessonCreate, LessonUpdate, LessonResponse, LessonListResponse
)
from app.schemas.interaction import (
    InteractionBase, InteractionCreate, InteractionResponse
)
from app.schemas.quiz import (
    QuizBase, QuizCreate, QuizUpdate, QuizResponse, QuizSubmission, QuizBatchSubmission, QuizEvaluationResult
)
from app.schemas.progress import (
    ProgressBase, ProgressCreate, ProgressUpdate, ProgressResponse
)
from app.schemas.flashcard import (
    FlashcardBase, FlashcardCreate, FlashcardUpdate, FlashcardResponse
)
from app.schemas.chat import (
    ChatBase, ChatCreate, ChatResponse, ChatListResponse, ChatWithCourseResponse
)
from app.schemas.certificate import CertificateResponse, CertificateListResponse

# Export all schemas
__all__ = [
    # User schemas
    'UserBase', 'UserCreate', 'UserUpdate', 'UserResponse', 'UserInDB',
    # Token schemas
    'Token', 'TokenPayload', 'TokenRefresh',
    # Course schemas
    'CourseBase', 'CourseCreate', 'CourseUpdate', 'CoursePlanUpdate', 'CourseResponse', 'CourseListResponse',
    # Lesson schemas
    'LessonBase', 'LessonCreate', 'LessonUpdate', 'LessonResponse', 'LessonListResponse',
    # Interaction schemas
    'InteractionBase', 'InteractionCreate', 'InteractionResponse',
    # Quiz schemas
    'QuizBase', 'QuizCreate', 'QuizUpdate', 'QuizResponse', 'QuizSubmission', 'QuizBatchSubmission', 'QuizEvaluationResult',
    # Progress schemas
    'ProgressBase', 'ProgressCreate', 'ProgressUpdate', 'ProgressResponse',
    # Flashcard schemas
    'FlashcardBase', 'FlashcardCreate', 'FlashcardUpdate', 'FlashcardResponse',
    # Chat schemas
    'ChatBase', 'ChatCreate', 'ChatResponse', 'ChatListResponse', 'ChatWithCourseResponse',
    # Certificate schemas
    'CertificateResponse', 'CertificateListResponse'
]
