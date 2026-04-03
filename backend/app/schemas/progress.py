from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ProgressBase(BaseModel):
    quiz_score: Optional[int] = None
    is_passed: bool = False
    student_status: Optional[str] = None


class ProgressCreate(ProgressBase):
    pass


class ProgressUpdate(BaseModel):
    quiz_score: Optional[int] = None
    is_passed: Optional[bool] = None
    student_status: Optional[str] = None


class ProgressResponse(ProgressBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    lesson_id: int
    created_at: datetime
    updated_at: datetime
