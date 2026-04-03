from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from langchain.agents import create_agent
from langchain.tools import tool
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import uuid
from app.models import Course, Lesson, Progress, User, Flashcard, Quiz, Interaction
from app.models.enums import LessonStatus

class FlashcardStructure(BaseModel):
    front: str = Field(description="The front of the flashcard (question/term)")
    back: str = Field(description="The back of the flashcard (answer/definition)")
    difficulty: str = Field(description="The difficulty level of the flashcard (e.g., 'easy', 'medium', 'hard')")

class TodayClassStructure(BaseModel):
    """Structured output for the generated today's class plan and content."""
    day_number: int = Field(description="The day number of the lesson")
    daily_plan: dict = Field(description="The structured plan for today's class (topics, estimated times, etc.)")
    content: str = Field(description="The comprehensive educational content generated for today's class based on the plan")
    summary: str = Field(description="A brief summary of today's lesson that can be used for tomorrow's context")
    flashcards: List[FlashcardStructure] = Field(description="A list of flashcards to help the student test their knowledge", default_factory=list)


class QuizStructure(BaseModel):
    """Structured output for a single quiz question."""
    question: str = Field(description="The quiz question text")
    options: List[str] = Field(description="The list of options (if multiple choice)", default_factory=list)
    correct_answer: str = Field(description="The correct answer text")
    explanation: str = Field(description="A brief explanation of why this answer is correct")
    quiz_type: str = Field(description="The type of quiz: 'multiple_choice', 'true_false', 'fill_blank', or 'short_answer'")


class QuizzesStructure(BaseModel):
    """Structured output for a list of quizzes."""
    quizzes: List[QuizStructure] = Field(description="The list of generated quizzes")


class QuizEvaluationItem(BaseModel):
    """Evaluation of a single quiz answer."""
    quiz_id: int = Field(description="The ID of the quiz being evaluated")
    is_correct: bool = Field(description="Whether the student's answer was correct")
    explanation: str = Field(description="A brief explanation of why the answer is correct or incorrect")


class EvaluationStructure(BaseModel):
    """Structured output for total quiz session evaluation."""
    evaluations: List[QuizEvaluationItem] = Field(description="The evaluation feedback for each quiz")
    score: int = Field(description="The final score out of 100")
    feedback: str = Field(description="The overall feedback for the student based on their performance")
    student_status: str = Field(description="The updated student level/status for this lesson")
    is_passed: bool = Field(description="True if the student has passed this lesson (usually score >= 70)")


class TutorAgent:
    """LangChain agent for teaching a student, generating lesson plans and content."""
    
    def __init__(self, groq_api_key: str, db: AsyncSession, user_id: int):
        self.llm = ChatGroq(
            model="qwen/qwen3-32b", 
            temperature=0.7,
            groq_api_key=groq_api_key
        )
        self.db = db
        self.user_id = user_id
        
    def _create_agent(self, lesson_id: int):
        """Create the LangChain agent with tutor capabilities."""
        
        @tool(args_schema=TodayClassStructure)
        async def generate_and_save_class_tool(day_number: int, daily_plan: dict, content: str, summary: str, flashcards: List[FlashcardStructure]) -> str:
            """Use this tool to finalize the today's class content and plan, and save it in the database."""
            try:
                lesson = await self.db.get(Lesson, lesson_id)
                if lesson:
                    lesson.daily_plan = daily_plan
                    lesson.content = content
                    lesson.summary = summary
                    
                    # Create and add flashcards
                    for fc_data in flashcards:
                        fc = Flashcard(
                            lesson_id=lesson.id,
                            front=fc_data.front,
                            back=fc_data.back,
                            difficulty=fc_data.difficulty
                        )
                        self.db.add(fc)
                        
                    await self.db.commit()
                    return f"Successfully saved today's class (Day {day_number}) into the database."
                else:
                    return f"Error: Lesson with ID {lesson_id} not found."
            except Exception as e:
                print(f"Error saving class output: {e}")
                return f"Failed to save class due to error: {str(e)}"

        @tool
        def calculator(expression: str) -> str:
            """A simple calculator tool. Use this for math expressions. Examples: '2 + 2', '3 * 4'"""
            try:
                allowed_names = {"__builtins__": None}
                result = eval(expression, allowed_names)
                return str(result)
            except Exception as e:
                return f"Error calculating the expression: {str(e)}"
                
        @tool
        def web_search(query: str) -> str:
            """Search the web for information about a topic."""
            # Placeholder for actual web search API integration
            return f"Search results for '{query}': Found highly relevant educational resources online to include in the lesson."

        @tool
        def image_search(query: str) -> str:
            """Search for images related to a topic."""
            return f"Found informative images related to '{query}'."
            
        @tool
        def youtube_video_search(query: str) -> str:
            """Search for informational YouTube videos about a topic."""
            return f"Found a relevant, high-quality educational video about '{query}'."
            
        @tool
        def google_translator(text: str, target_language: str) -> str:
            """Translate text into the student's native language."""
            return f"Successfully translated to {target_language}."

        tools = [
            generate_and_save_class_tool,
            calculator,
            web_search,
            image_search,
            youtube_video_search,
            google_translator
        ]
        
        system_prompt = """You are an expert AI Tutor Agent designed to teach a student.
        Your goal is to prepare today's class based on the provided context. You should generate an engaging class plan (`daily_plan`), comprehensive class material (`content`), a brief `summary` of the lesson, and `flashcards` to test the student. 
        You MUST use the `generate_and_save_class_tool` when you have successfully designed the daily plan, content, and flashcards to update the database.
        
        You have multiple helpful tools at your disposal: web search, image search, Youtube video search, google translator, and a calculator. Use them if you need more information or need to explain concepts more clearly.
        
        Always adapt the lesson to the student's native language if necessary, and use their 'student_status' (previous progress) to tailor the start of the lesson.
        """
        
        agent = create_agent(
            model=self.llm,
            tools=tools,
            system_prompt=system_prompt
        )
        
        return agent

    async def generate_lesson_content(
        self,
        lesson_id: int,
        prompt: str = "Please generate today's class content and plan."
    ) -> Dict[str, Any]:
        """Collect information and generate the class for the day."""
        
        # 1. Collect information from database
        lesson = await self.db.get(Lesson, lesson_id)
        if not lesson:
            return {"error": "Lesson not found."}
            
        course = await self.db.get(Course, lesson.course_id)
        user = await self.db.get(User, self.user_id)
        
        # Get the latest progress for the student
        progress_result = await self.db.execute(
            select(Progress)
            .where(Progress.lesson_id == lesson_id)
            .order_by(Progress.created_at.desc())
            .limit(1)
        )
        last_progress = progress_result.scalars().first()
        student_status = last_progress.student_status if last_progress else "No previous records or beginner level for this lesson."
        
        # Get previous lesson summary
        prev_lesson_result = await self.db.execute(
            select(Lesson)
            .where(
                Lesson.course_id == course.id, 
                Lesson.day_number < lesson.day_number
            )
            .order_by(Lesson.day_number.desc())
            .limit(1)
        )
        prev_lesson = prev_lesson_result.scalars().first()
        prev_summary = prev_lesson.summary if prev_lesson else "None."

        # Compile the context
        context_message = f"""
        Here is the collected information to generate today's class content:
        ---
        **User Information**: Username: {user.username}, Native Language: {user.native_language or 'English'}
        **Course Information**: Title: {course.title}, Description: {course.description}, Goal: {course.goal}
        **Lesson Target**: Day {lesson.day_number}
        **Lesson Title**: {lesson.title}
        **Lesson Description**: {lesson.description}
        **Previous Lesson Summary**: {prev_summary}
        **Student Status**: {student_status}
        ---
        Based on the above context, execute your role: Use tools to gather insights if needed, and DEFINITELY use the `generate_and_save_class_tool` to insert the final daily plan and content to the database!
        User request: {prompt}
        """

        agent = self._create_agent(lesson_id=lesson.id)
        
        try:
            # Generate the content
            messages = [HumanMessage(content=context_message)]
            
            result = await agent.ainvoke({"messages": messages})
            
            last_message = result.get("messages", [])[-1]
            response_content = last_message.content if getattr(last_message, 'content', None) else "Generated the class successfully."

            # Verify if the lesson was successfully updated
            await self.db.refresh(lesson)

            return {
                "lesson_id": lesson.id,
                "response": response_content,
                "daily_plan": lesson.daily_plan,
                "content": lesson.content,
                "summary": lesson.summary
            }
            
        except Exception as e:
            return {"error": f"An error occurred while generating the class: {str(e)}"}
    async def generate_lesson_quizzes(
        self,
        lesson_id: int,
        num_quizzes: int = 5
    ) -> List[Quiz]:
        """Generate and save a set of quizzes for a lesson using a common session ID."""
        
        lesson = await self.db.get(Lesson, lesson_id)
        if not lesson:
            return []
            
        course = await self.db.get(Course, lesson.course_id)
        
        # Compile context for quiz generation
        context = f"""
        Lesson Title: {lesson.title}
        Lesson Description: {lesson.description}
        Lesson Content: {lesson.content[:2000]}  # Use first 2000 chars for context
        Course Goal: {course.goal}
        """
        
        prompt = f"""
        Based on the lesson content provided below, generate {num_quizzes} high-quality quiz questions to test the student's understanding.
        Ensure a mix of 'multiple_choice' and 'true_false' types.
        
        CONTEXT:
        {context}
        """
        
        # Create a session ID for this set of quizzes
        session_id = str(uuid.uuid4())
        
        # Use structured output for quizzes
        llm_with_structure = self.llm.with_structured_output(QuizzesStructure)
        
        try:
            result = await llm_with_structure.ainvoke([HumanMessage(content=prompt)])
            
            saved_quizzes = []
            for q_data in result.quizzes:
                quiz = Quiz(
                    lesson_id=lesson_id,
                    session_id=session_id,
                    question=q_data.question,
                    options=q_data.options,
                    correct_answer=q_data.correct_answer,
                    explanation=q_data.explanation,
                    type=q_data.quiz_type
                )
                self.db.add(quiz)
                saved_quizzes.append(quiz)
                
            await self.db.commit()
            
            # Refresh to get IDs
            for q in saved_quizzes:
                await self.db.refresh(q)
                
            return saved_quizzes
            
        except Exception as e:
            print(f"Error generating quizzes: {e}")
            return []

    async def evaluate_lesson_quizzes(
        self,
        lesson_id: int,
        session_id: str,
        student_submissions: Dict[int, str]
    ) -> Dict[str, Any]:
        """Evaluate a batch of quizzes and update the student's progress and lesson status."""
        
        # 1. Get lesson and quizzes
        lesson = await self.db.get(Lesson, lesson_id)
        if not lesson:
            return {"error": "Lesson not found"}
            
        from sqlalchemy import select
        result = await self.db.execute(
            select(Quiz).where(Quiz.lesson_id == lesson_id, Quiz.session_id == session_id)
        )
        quizzes = result.scalars().all()
        
        if not quizzes:
            return {"error": "No quizzes found for this session"}
            
        # 2. Compile evaluation context
        quiz_data = [{
            "id": q.id,
            "question": q.question,
            "correct_answer": q.correct_answer,
            "student_answer": student_submissions.get(str(q.id), "No answer provided")
        } for q in quizzes]

        print('\n'*10, student_submissions,'\n'*10)
        print('\n'*10, quiz_data,'\n'*10)
        
        prompt = f"""
        Evaluate the student's performance on the following quizzes for the lesson '{lesson.title}'.
        For each quiz, determine if the answer is correct (be reasonably lenient with typos or minor phrasing for short answers).
        Calculate the overall score (0-100), give encouraging feedback, and decide if they passed (score >= 70).
        Finally, update the 'student_status' which summarizes what they learned and where they need improvement.
        
        QUIZZES:
        {quiz_data}
        """
        
        # 3. Get LLM evaluation
        llm_with_evaluation = self.llm.with_structured_output(EvaluationStructure)
        
        try:
            eval_result = await llm_with_evaluation.ainvoke([HumanMessage(content=prompt)])
            
            # 4. Save results back to quizzes
            quiz_map = {q.id: q for q in quizzes}
            for item in eval_result.evaluations:
                if item.quiz_id in quiz_map:
                    q = quiz_map[item.quiz_id]
                    q.student_answer = student_submissions.get(str(item.quiz_id))
                    q.is_correct = item.is_correct
            
            # 5. Create Progress record
            progress = Progress(
                lesson_id=lesson_id,
                quiz_score=eval_result.score,
                is_passed=eval_result.is_passed,
                student_status=eval_result.student_status
            )
            self.db.add(progress)
            
            # 6. Update Lesson Status if passed
            if eval_result.is_passed:
                lesson.status = LessonStatus.COMPLETED
                
                # Unlock next lesson if it exists
                next_lesson_result = await self.db.execute(
                    select(Lesson).where(
                        Lesson.course_id == lesson.course_id,
                        Lesson.day_number == lesson.day_number + 1
                    )
                )
                next_lesson = next_lesson_result.scalar_one_or_none()
                if next_lesson:
                    next_lesson.is_locked = False
            
            await self.db.commit()
            
            # Refresh to get IDs
            await self.db.refresh(lesson)
            
            return {
                "score": eval_result.score,
                "total_questions": len(quizzes),
                "is_passed": eval_result.is_passed,
                "feedback": eval_result.feedback,
                "student_status": eval_result.student_status,
                "quizzes": quizzes
            }
            
        except Exception as e:
            print(f"Error evaluating quizzes: {e}")
            return {"error": f"An error occurred while evaluating quizzes: {str(e)}"}

    async def ask_tutor(self, lesson_id: int, question: str) -> str:
        """Answer a student's question about a specific lesson."""
        
        # 1. Get lesson context
        lesson = await self.db.get(Lesson, lesson_id)
        if not lesson:
            return "Lesson not found."
            
        course = await self.db.get(Course, lesson.course_id)
        user = await self.db.get(User, self.user_id)
        
        # 2. Get recent interaction history (last 5)
        from langchain_core.messages import AIMessage
        
        history_result = await self.db.execute(
            select(Interaction)
            .where(Interaction.lesson_id == lesson_id)
            .order_by(Interaction.created_at.desc())
            .limit(5)
        )
        history = list(reversed(history_result.scalars().all()))
        
        # Compile context for the question
        context_prompt = f"""
        User Information: Username: {user.username}, Native Language: {user.native_language or 'English'}
        Course Information: Title: {course.title}, Description: {course.description}
        Lesson Information: Title: {lesson.title}, Content: {lesson.content[:4000]}
        ---
        The student has a question about this lesson content. Provide a clear, helpful, and encouraging answer 
        in the student's native language if applicable. Use your expertise to explain concepts simply.
        """
        
        messages = [HumanMessage(content=context_prompt)]
        
        # Add history to messages
        for interact in history:
            messages.append(HumanMessage(content=interact.user_question))
            messages.append(AIMessage(content=interact.ai_answer))
            
        # Add the current question
        messages.append(HumanMessage(content=f"Current Student Question: {question}"))
        
        try:
            result = await self.llm.ainvoke(messages)
            return result.content
        except Exception as e:
            print(f"Error answering question: {e}")
            return f"I'm sorry, I encountered an error while trying to answer your question: {str(e)}"
