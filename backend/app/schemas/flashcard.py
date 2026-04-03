from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class FlashcardBase(BaseModel):
    front: str
    back: str
    difficulty: Optional[str] = Field(None, max_length=50)


class FlashcardCreate(FlashcardBase):
    pass


class FlashcardUpdate(BaseModel):
    front: Optional[str] = None
    back: Optional[str] = None
    difficulty: Optional[str] = Field(None, max_length=50)


class FlashcardResponse(FlashcardBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    lesson_id: int
    created_at: datetime
