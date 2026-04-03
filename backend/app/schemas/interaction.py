from datetime import datetime
from pydantic import BaseModel, ConfigDict


class InteractionBase(BaseModel):
    user_question: str


class InteractionCreate(InteractionBase):
    pass


class InteractionResponse(InteractionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    lesson_id: int
    ai_answer: str
    created_at: datetime
