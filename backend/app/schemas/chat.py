from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ChatBase(BaseModel):
    session_id: Optional[str] = Field(None, max_length=100)
    prompt: str
    response: str


class ChatCreate(BaseModel):
    session_id: Optional[str] = Field(None, max_length=100, description="Optional session identifier")
    prompt: str = Field(..., description="User's prompt or request")


class ChatResponse(ChatBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    created_at: datetime


class ChatListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    session_id: Optional[str]
    prompt: str
    response: str
    created_at: datetime


class ChatWithCourseResponse(BaseModel):
    """Response schema for chat with optional course data."""
    id: int
    user_id: int
    session_id: Optional[str]
    prompt: str
    response: str
    created_at: datetime
    
    # Use string annotation to avoid circular import
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "properties": {
                "course": {
                    "anyOf": [
                        {"$ref": "#/definitions/CourseResponse"},
                        {"type": "null"}
                    ]
                }
            }
        }
    )
    
    # Define course field as Optional[dict] to avoid import issues
    course: Optional[dict] = None
