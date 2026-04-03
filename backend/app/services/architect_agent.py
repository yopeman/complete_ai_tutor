from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain.agents import create_agent
from langchain.tools import tool
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.chat import Chat
from app.models import Course
from app.schemas import CourseCreate
import uuid

class CourseStructure(BaseModel):
    """Structured output schema for course creation. Compatible with Course model."""
    title: str = Field(description="The course title", min_length=1, max_length=255)
    description: str = Field(description="Detailed description of the course")
    difficulty: Literal["beginner", "intermediate", "advanced"] = Field(description="Difficulty level of the course")
    goal: str = Field(description="Main learning goal of the course")
    objectives: List[str] = Field(description="List of learning objectives", default_factory=list)
    estimated_duration_days: int = Field(description="Estimated duration in days", ge=1)
    course_plan: str = Field(description="Detailed course plan in markdown format with lessons organized by day")


class ArchitectAgent:
    """LangChain agent for creating courses based on user prompts."""
    
    def __init__(self, groq_api_key: str, db: AsyncSession, user_id: int):
        self.llm = ChatGroq(
            model="qwen/qwen3-32b",
            temperature=0.7,
            groq_api_key=groq_api_key
        )
        self.db = db
        self.user_id = user_id
        self.created_course = None
        self.agent = self._create_agent()
    
    def _create_agent(self):
        """Create the LangChain agent with course creation tools."""
        
        @tool(args_schema=CourseStructure)
        async def create_course_tool(title: str, description: str, difficulty: str, goal: str, objectives: List[str], estimated_duration_days: int, course_plan: str) -> str:
            """Use this tool to create a course based on the user's prompt. Call this ONLY IF the user's prompt is clear and useful for creating a course."""
            try:
                course_create = CourseCreate(
                    title=title,
                    description=description,
                    difficulty=difficulty,
                    goal=goal,
                    objectives=objectives,
                    estimated_duration_days=estimated_duration_days,
                    status="active",
                    course_plan=course_plan
                )
                
                db_course = Course(
                    user_id=self.user_id,
                    title=course_create.title,
                    description=course_create.description,
                    difficulty=course_create.difficulty,
                    goal=course_create.goal,
                    objectives=course_create.objectives,
                    estimated_duration_days=course_create.estimated_duration_days,
                    status=course_create.status,
                    course_plan=course_create.course_plan
                )
                
                self.db.add(db_course)
                await self.db.commit()
                await self.db.refresh(db_course)
                
                self.created_course = db_course
                
                return f"Course '{title}' successfully created in database with ID {db_course.id}."
            except Exception as e:
                print(f"Error creating course: {e}")
                return f"Failed to create course due to error: {str(e)}"
        
        system_prompt = """You are an Architect Agent, an expert educational content designer. 
        Your role is to help users create comprehensive courses based on their prompts.

        IMPORTANT RULES:
        1. Evaluate if the user's prompt is sufficient and useful for creating a course and planning.
        2. If the user's prompt is NOT useful or is unclear for creating a course, DO NOT use the create course tool. Instead, politely ask the user for more clarification or details.
        3. Never hallucinate or make up completely unrelated course content.
        4. If the prompt is sufficient, use the `create_course_tool` to structure the course data.
        
        Use the conversation history to maintain context across interactions. Be conversational and helpful."""
        
        tools = [create_course_tool]
        
        agent = create_agent(
            model=self.llm,
            tools=tools,
            system_prompt=system_prompt
        )
        
        return agent
    
    async def process_prompt(
        self, 
        prompt: str, 
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process user prompt and return agent response."""
        
        # Generate session_id if not provided
        if not session_id:
            session_id = str(uuid.uuid4())
        
        # Get conversation history
        chat_history = await self._load_chat_history(session_id)
        
        # Process with agent
        try:
            # Prepare messages with conversation history using proper LangChain message format
            messages = []
            
            # Add conversation history if available
            for chat in chat_history:
                messages.append(HumanMessage(content=chat.prompt))
                messages.append(AIMessage(content=chat.response))
                
            messages.append(HumanMessage(content=prompt))
            
            result = await self.agent.ainvoke({
                "messages": messages
            })
            
            response = "I processed your request."
            
            if "messages" in result and result["messages"]:
                last_message = result["messages"][-1]
                response = last_message.content if getattr(last_message, 'content', None) else "I processed your request."
            
            # Save conversation to database
            await self._save_conversation(
                prompt=prompt,
                response=response,
                session_id=session_id
            )
            
            return {
                "response": response,
                "session_id": session_id,
                "course": self.created_course
            }
            
        except Exception as e:
            return {
                "response": f"I apologize, but I encountered an error: {str(e)}",
                "session_id": session_id,
                "course": None
            }
    
    async def _load_chat_history(self, session_id: str) -> List[Chat]:
        """Load chat history from database."""
        result = await self.db.execute(
            select(Chat)
            .where(Chat.session_id == session_id, Chat.user_id == self.user_id)
            .order_by(Chat.created_at)
        )
        return list(result.scalars().all())
    
    async def _save_conversation(
        self,
        prompt: str,
        response: str,
        session_id: str
    ):
        """Save conversation to database."""
        chat = Chat(
            user_id=self.user_id,
            session_id=session_id,
            prompt=prompt,
            response=response
        )
        self.db.add(chat)
        await self.db.commit()
