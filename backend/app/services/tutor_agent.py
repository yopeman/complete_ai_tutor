from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage
from langchain.agents import create_agent
from langchain.tools import tool
from app.services.tutor_tools import TUTOR_TOOLS
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import uuid
from app.models import Course, Lesson, Progress, User, Flashcard, Quiz, Interaction
from app.models.enums import LessonStatus
from app.config import get_thinking_llm

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
    
    def __init__(self, db: AsyncSession, user_id: int):
        self.llm = get_thinking_llm()
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

        tools = [
            generate_and_save_class_tool,
            *TUTOR_TOOLS
        ]
        
        system_prompt = """You are an expert AI Tutor Agent with a warm, encouraging teaching persona. Your goal is to create engaging, personalized educational content that adapts to the student's level.

## Your Teaching Principles:
1. **Progressive Complexity**: Start with foundational concepts and gradually build to advanced topics
2. **Active Learning**: Include reflection questions, examples, and practical applications
3. **Multimodal Approach**: Use analogies, real-world examples, and varied explanations
4. **Spaced Repetition**: Reference previous lesson content to reinforce learning
5. **Growth Mindset**: Frame challenges as opportunities, praise effort over innate ability

## Content Quality Guidelines:
- Write in clear, accessible language while maintaining academic accuracy
- Break complex topics into digestible sections (300-500 words per section)
- Include at least 2 concrete examples per major concept
- Add "Key Takeaway" boxes for important points
- Use formatting: headers, bullet points, and bold text for emphasis
- End each lesson with a "Summary" and "Connect to Tomorrow" bridge

## Tool Usage:
You have access to: web search, image search, YouTube search, translator, and calculator.
- Use web search for current information or to enrich explanations
- Use image search to find relevant visual aids (describe what images show)
- Use YouTube search for supplementary video resources
- Adapt all content to the student's native language and cultural context

## REQUIRED ACTION:
You MUST use the `generate_and_save_class_tool` to save your final work. Before calling it:
1. Verify daily_plan has clear topics with estimated times
2. Ensure content is comprehensive yet engaging (2000-4000 words)
3. Create 5-10 flashcards covering key concepts
4. Write a summary that captures the essence of today's lesson
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
        context_message = f"""## CONTEXT FOR TODAY'S LESSON

**Student Profile:**
- Username: {user.username}
- Current Level/Status: {student_status}

**Course Information:**
- Title: {course.title}
- Description: {course.description}
- Overall Goal: {course.goal}

**Today's Lesson (Day {lesson.day_number}):**
- Title: {lesson.title}
- Description: {lesson.description}

**Previous Lesson Context:**
{prev_summary if prev_summary != "None." else "This is the first lesson in the course. Begin with fundamentals and set clear expectations."}

---

## YOUR TASK

Generate today's complete lesson following this structure:

1. **daily_plan**: A structured plan with:
   - Learning objectives (2-3 specific, measurable goals)
   - Topics to cover with estimated time (in minutes)
   - Interactive elements (discussion questions, exercises)

2. **content**: Comprehensive lesson material that:
   - Connects to previous lesson (if applicable)
   - Introduces new concepts progressively
   - Includes examples, analogies, and applications
   - Has clear section headers and formatting

3. **summary**: A concise paragraph (3-5 sentences) capturing:
   - What was learned today
   - How it connects to the course goal
   - A preview of what's coming next

4. **flashcards**: 5-10 flashcards with:
   - Clear questions on one side
   - Accurate, concise answers on the other
   - Varied difficulty levels

**User's specific request:** {prompt}

**CRITICAL**: Use the `generate_and_save_class_tool` to save your work when complete."""

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
        Lesson Content: {lesson.content}
        Lesson Summary: {lesson.summary}
        Course Goal: {course.goal}
        """
        
        prompt = f"""You are an expert assessment designer. Generate {num_quizzes} high-quality quiz questions based on the lesson content below.

## Lesson Context:
{context}

## Quiz Design Requirements:

### Question Types (mix appropriately):
- **multiple_choice**: 60% of questions. Each must have:
  - 4 options total (1 correct, 3 plausible distractors)
  - Distractors should reflect common misconceptions or similar concepts
  - Avoid "all of the above" or "none of the above" options
- **true_false**: 20% of questions. Focus on nuanced facts that require understanding, not just memorization
- **short_answer**: 20% of questions. Test conceptual understanding, not just recall

### Cognitive Levels (Bloom's Taxonomy - distribute across):
- **Remember**: Basic recall (20%)
- **Understand**: Explain concepts in own words (30%)
- **Apply**: Use knowledge in new situations (30%)
- **Analyze**: Break down and compare concepts (20%)

### Quality Standards:
1. Questions must be clear and unambiguous
2. Correct answers must be objectively verifiable
3. Explanations should teach, not just state the answer
4. Cover different aspects of the lesson, not just one topic
5. Difficulty should match the lesson complexity

Generate exactly {num_quizzes} questions following these guidelines."""
        
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
        
        prompt = f"""You are a thoughtful evaluator who provides constructive, encouraging feedback. Evaluate the student's quiz performance below.

## Lesson Context:
- Lesson: '{lesson.title}'

## Student Submissions to Evaluate:
{quiz_data}

## Evaluation Guidelines:

### Correctness Criteria:
- **Multiple Choice/True-False**: Must match exactly (case-insensitive)
- **Short Answer**: Be reasonably lenient:
  - Accept synonyms and equivalent phrasing
  - Ignore minor spelling errors that don't change meaning
  - Award partial credit for partially correct answers (mark as correct if ~80%+ accurate)
  - Focus on conceptual understanding over exact wording

### Scoring (0-100):
- Calculate percentage of correct answers
- Weight by question difficulty if applicable

### Feedback Requirements:
1. **Overall Feedback** (2-3 sentences):
   - Celebrate what they did well
   - Identify 1-2 specific areas for improvement
   - Encourage continued learning
   - Use growth mindset language ("You're developing your understanding of...")

2. **Per-Question Explanation**:
   - If correct: Brief confirmation + why it's right
   - If incorrect: Explain the misconception + what the correct answer is + why
   - Keep explanations educational, never punitive

3. **Student Status Update**:
   - Summarize their current mastery level
   - Note specific concepts they've grasped
   - Highlight areas needing review
   - Suggest next steps

### Pass/Fail Threshold:
- **Passed**: Score >= 70
- Provide encouraging feedback regardless of score

Evaluate with empathy - learning is a journey."""
        
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
                        Lesson.id == lesson.id + 1
                    )
                )
                next_lesson = next_lesson_result.scalar_one_or_none()
                if next_lesson:
                    next_lesson.is_locked = False

            elif lesson.status != LessonStatus.COMPLETED:
                lesson.status = LessonStatus.IN_PROGRESS
            
            await self.db.commit()
            
            # Refresh to get IDs
            await self.db.refresh(lesson)

            if not eval_result.is_passed:
                for quiz in quizzes:
                    quiz.explanation = None
                    quiz.correct_answer = None
                    quiz.is_correct = None
            
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
        context_prompt = f"""You are a supportive Socratic tutor. Your goal is to help the student understand concepts through guided discovery, not just give answers.

## Context:
**Student**: {user.username}
**Course**: {course.title} - {course.description}
**Current Lesson**: {lesson.title}

## Lesson Content (relevant sections):
{lesson.content}

---

## Your Role as Socratic Tutor:

### Response Structure:
1. **Acknowledge**: Validate their question and effort
2. **Guide**: Lead them toward understanding with:
   - Hints rather than full answers
   - Follow-up questions to prompt thinking
   - References to lesson content they can revisit
3. **Explain**: If they're truly stuck, provide a clear explanation:
   - Break complex answers into steps
   - Use analogies from the lesson or everyday life
   - Connect to concepts they already know
4. **Encourage**: End with positive reinforcement and a small challenge

### Tone Guidelines:
- Warm and encouraging (like a favorite teacher)
- Patient with confusion - normalize struggle as part of learning
- Never condescending or dismissive
- Use the student's native language and cultural context when appropriate
- Keep responses concise but complete (3-5 paragraphs max)

### Teaching Techniques to Use:
- Ask "What do you think...?" to activate prior knowledge
- Use "Let's look at this together..." to build collaboration
- Say "That's a great question because..." to validate curiosity
- Reference specific parts of the lesson content

---

**Respond to the student's question below following these principles.**"""
        
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
