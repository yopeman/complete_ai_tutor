from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class CourseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    difficulty: Optional[str] = Field(None, max_length=50)
    goal: Optional[str] = Field(None, max_length=500)
    objectives: List[str] = Field(default_factory=list)
    estimated_duration_days: Optional[int] = None
    status: str = "active"
    course_plan: Optional[str] = None


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    difficulty: Optional[str] = Field(None, max_length=50)
    goal: Optional[str] = Field(None, max_length=500)
    objectives: Optional[List[str]] = None
    estimated_duration_days: Optional[int] = None

class CoursePlanUpdate(BaseModel):
    course_plan: str


class CourseResponse(CourseBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime


class CourseListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    title: str
    status: str
    estimated_duration_days: Optional[int]
    created_at: datetime
