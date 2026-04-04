from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class Slide(BaseModel):
    title: str
    content: str
    audio_path: str


class PPT(BaseModel):
    slides: list[Slide]


class PresentationBase(BaseModel):
    lesson_id: int
    generated_ppt: PPT


class PresentationCreate(PresentationBase):
    pass


class PresentationResponse(PresentationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
