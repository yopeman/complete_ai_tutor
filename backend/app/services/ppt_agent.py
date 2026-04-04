import os
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage, SystemMessage
from langchain.agents import create_agent
from langchain.tools import tool
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_llm, get_settings
from app.services.tts_and_stt import text_to_speech
from app.models import Course, Lesson, Presentation
from app.schemas.presentation import PPT, Slide
import uuid


class SlideItem(BaseModel):
    """Single slide content for LLM output."""
    title: str = Field(description="The title of the slide")
    content: str = Field(description="The content text for the slide")


class PPTStructure(BaseModel):
    """Structured output for the generated PPT content."""
    slides: List[SlideItem] = Field(description="List of 6 slides. Slides must be: Hero, Outline, Introduction, Detail, Summary, and Thanks!.")


class PPTAgent:
    """LangChain agent for generating educational presentations for lessons."""
    
    def __init__(self, db: AsyncSession, user_id: int):
        self.llm = get_llm()
        self.db = db
        self.user_id = user_id
        self.settings = get_settings()

    async def generate_presentation(self, lesson_id: int) -> Optional[PPT]:
        """Generate a complete PPT for a lesson including audio synthesis."""
        
        # 1. Get lesson context
        lesson = await self.db.get(Lesson, lesson_id)
        if not lesson:
            return None

        course = await self.db.get(Course, lesson.course_id)        
            
        # 2. Generate Slide Content using LLM with structured output
        # Using with_structured_output for cleaner JSON generation
        llm_with_structure = self.llm.with_structured_output(PPTStructure)
        
        system_prompt = """You are an expert Presentation Designer. 
        Your goal is to create a structured educational presentation (6 slides) based on the lesson content provided.
        
        SLIDE STRUCTURE REQUIRED:
        1. Hero Slide: Catchy title and subtitle.
        2. Outline: What will be covered.
        3. Introduction: Core concept introduction.
        4. Detail: Deep dive into the main content.
        5. Summary: Key takeaways.
        6. Thanks!: A polite closing slide.
        
        For each slide, provide a 'title' and 'content'. The 'content' should be concise and bulleted where appropriate, optimized for a slide deck.
        """
        
        user_prompt = f"""
        Generate a presentation for the following lesson:
        ---
        Title: {lesson.title}
        Course name: {course.title}
        Class: day {lesson.day_number} class
        Description: {lesson.description}
        Outlines: {lesson.daily_plan}
        Content: {lesson.content}
        Summary: {lesson.summary}
        ---
        """
        
        try:
            # Generate the content
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ]
            
            result = await llm_with_structure.ainvoke(messages)
            
            # 3. Process slides and generate audio
            final_slides = []
            for slide_item in result.slides:
                title = slide_item.title
                content = slide_item.content

                
                # Combine title and content for TTS
                tts_text = f"{title}. {content}"
                
                # Generate audio
                # text_to_speech returns local path like 'audio_cache/uuid.mp3'
                local_audio_path = text_to_speech(tts_text)
                
                # Bind with backend_base_url
                # Ensure we don't have double slashes if base_url ends with /
                base_url = self.settings.backend_base_url.rstrip("/")
                audio_filename = os.path.basename(local_audio_path)
                full_audio_url = f"{base_url}/audio_cache/{audio_filename}"
                
                final_slides.append(Slide(
                    title=title,
                    content=content,
                    audio_path=full_audio_url
                ))
            
            ppt_instance = PPT(slides=final_slides)
            
            # 4. Save to database
            # Convert PPT to dict/json for storage
            generated_ppt_json = ppt_instance.dict()
            
            # Check if presentation already exists
            from sqlalchemy import select
            existing_result = await self.db.execute(
                select(Presentation).where(Presentation.lesson_id == lesson_id)
            )
            db_presentation = existing_result.scalar_one_or_none()
            
            if db_presentation:
                db_presentation.generated_ppt = generated_ppt_json
            else:
                db_presentation = Presentation(
                    lesson_id=lesson_id,
                    generated_ppt=generated_ppt_json
                )
                self.db.add(db_presentation)
            
            await self.db.commit()
            await self.db.refresh(db_presentation)
            
            return ppt_instance
            
        except Exception as e:
            print(f"Error generating presentation: {e}")
            await self.db.rollback()
            return None
