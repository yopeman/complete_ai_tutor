from pydantic import BaseModel

class Slide(BaseModel):
    title: str
    content: str
    audio_path: str

class PPT(BaseModel):
    slides: list[Slide]
