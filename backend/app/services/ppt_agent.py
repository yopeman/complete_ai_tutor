import os
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage, SystemMessage
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_settings, get_generating_llm
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
        self.llm = get_generating_llm()
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
        
        system_prompt = """You are an expert Educational Presentation Designer with deep expertise in instructional design and visual communication.

Your goal is to create a compelling 6-slide educational presentation that transforms lesson content into an engaging, memorable learning experience.

=== SLIDE STRUCTURE REQUIREMENTS ===
You MUST create exactly 6 slides in this order:
1. Hero Slide: Attention-grabbing title with a compelling subtitle that sparks curiosity
2. Outline: Clear roadmap of what learners will discover (3-4 key topics)
3. Introduction: Hook the learner with the "why" and core concept foundation
4. Detail: Rich, structured deep-dive into the main content with concrete examples
5. Summary: 3-4 actionable key takeaways that reinforce learning
6. Thanks!: Professional closing with a forward-looking call to action

=== CONTENT QUALITY GUIDELINES ===
- **Concise**: Each slide should have 3-5 bullet points max, 15-25 words per bullet
- **Scannable**: Use clear hierarchy, key terms in bold, and logical flow
- **Actionable**: Focus on "what to know" and "why it matters"
- **Engaging**: Use active voice, varied sentence structure, and educational tone
- **Consistent**: Maintain terminology and style across all slides

=== FORMATTING RULES ===
- Use bullet points (•) for all content, never paragraphs
- Bold (**term**) key concepts, terminology, and important takeaways
- Use numbered lists (1., 2., 3.) only for sequential processes
- Include 1-2 concrete examples or analogies in the Detail slide
- Avoid filler words: "very", "really", "just", "thing"

=== AUDIENCE AWARENESS ===
Assume the audience is adult learners seeking practical knowledge. Balance accessibility with depth—explain technical terms briefly in context."""
        
        user_prompt = f"""=== LESSON CONTEXT ===
COURSE: {course.title}
LESSON: {lesson.title} (Day {lesson.day_number})

=== LESSON DESCRIPTION ===
{lesson.description}

=== LEARNING ROADMAP (Daily Plan) ===
{lesson.daily_plan}

=== CORE CONTENT TO TEACH ===
{lesson.content}

=== KEY TAKEAWAYS TO REINFORCE ===
{lesson.summary}

=== YOUR TASK ===
Transform the above content into a 6-slide educational presentation following the structure and quality guidelines in your instructions.

Requirements:
- Ensure each slide title is descriptive and engaging (5-8 words max)
- Cover ALL key points from the lesson content in the Detail slide
- Make the Summary slide reinforce the most important concepts
- Use formatting (bullet points, bold text) consistently throughout
- The presentation should feel cohesive—like a complete learning journey"""
        
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
