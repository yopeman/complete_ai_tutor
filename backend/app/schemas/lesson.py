from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class LessonBase(BaseModel):
    day_number: int = Field(..., ge=1)
    title: str = Field(..., min_length=1, max_length=255)
    daily_plan: Dict[str, Any] = Field(default_factory=dict)
    content: Optional[str] = None
    summary: Optional[str] = None
    status: str = "not_started"
    is_locked: bool = True


class LessonCreate(LessonBase):
    pass


class LessonUpdate(BaseModel):
    day_number: Optional[int] = Field(None, ge=1)
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    daily_plan: Optional[Dict[str, Any]] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    status: Optional[str] = None
    is_locked: Optional[bool] = None


class LessonResponse(LessonBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    course_id: int
    created_at: datetime
    updated_at: datetime


class LessonListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    day_number: int
    title: str
    description: str
    status: str
    is_locked: bool
    created_at: datetime
