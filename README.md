# AI Tutor: Multi-Agent Autonomous Learning System

## The Problem: The "One-Size-Fits-All" Learning Barrier
Traditional online education is built on monoliths — static curriculum, linear paths, and non-adaptive evaluation.
 Learners often find themselves either overwhelmed by advanced topics they aren't prepared for or bored by basic concepts they already know. 
 Accessing specialized tutors is expensive, and most AI solutions are simple "chat-wrappers" that lack a structured educational pedagogical flow.

## The Solution: A Decentralized Educational Ecosystem
AI Tutor is a **Multi-Agent Orchestration Platform** that autonomously plans, teaches, evaluates, and certifies.
 Instead of a single LLM trying to do everything, our platform utilizes four specialized AI agents that collaborate in a closed-loop mastery model:

1.  **Architecture First**: It starts by understanding *who* the learner is by asking questions about their background, interests, and goals and builds a custom curriculum from scratch optimally.
2.  **Adaptive Teaching**: It delivers lessons enriched with documents, real-time web search, youtube videos display in the inside the lesson and chat by iframe, visual aids, and interactive chat answering with voice and text.
and also present the lesson in a form of presentation with audio narration.direct chat intraction.
3.  **Mastery-Gated Progression**: It ensures a student cannot move to  next   Lesson until finished the current lesson and evaluated by the Assessor.
 **Assessor** verifies complete comprehension of current Lesson and gives a pass or fail.
4.  **Tangible Achievement**: It synthesizes the journey into spaced-repetition flashcards and official certifications upon completion.


##  Core Agent Capabilities & Tool Calling

A critical differentiator of the AI Tutor platform is its **Autonomous Tool Calling** system. Agents aren't limited to their training data; they actively interact with the digital world to provide up-to-date and accurate information:

- **Web Search Tool**: The Tutor autonomously queries live documentation and academic sources to ensure content accuracy.
- **YouTube Integration**: Finds and embeds relevant video tutorials directly into the lesson for a multi-modal experience.
- **Image Intelligence**: Automatically retrieves diagrams, charts, and visual aids to explain complex STEM concepts.
- **Translation Engine**: Explains difficult terms or provides entire lesson summaries in the learner's native language when needed.
- **State Persistence**: The system maintains a "Knowledge Profile" for every user, adjusting the difficulty and tone based on past quiz performance and interaction history.

##  Key Innovation Highlights

### Interactive Multi-Modal Learning
- **Presentation Mode**: Click a button to transform any lesson into a full-screen slide deck with synchronized AI audio narration (TTS).
- **Voice-to-Voice**: Full Speech-to-Text (STT) interaction for a completely hands-free learning experience.

### Commercial-Grade Payment Integration
- **Transaction Gating**: Integrated with **Chapa Payment Gateway** to handle premium unlocking of advanced course modules.
- **Master Log**: Students can track their transaction history and status through a secure financial dashboard.

### Automated Academic Certification
- **Mastery Validation**: The system auto-generates certificates of achievement once the learner reaches 100% completion verified by the Assessor.
- **Reference Tracking**: Each certificate includes unique reference codes for external verification.

### Spaced Repetition Synthesizer
- **Smart Flashcards**: Automatically generates difficulty-rated flashcards from lesson content to ensure long-term retention.
- **Progress Command Center**: A unified dashboard tracking streaks, mastery scores, and recent activity.


## 🧠 System Hierarchy & Flow

```text
       ┌───────────┐
       │   USER    │
       └─────┬─────┘
             │
      ┌──────▼──────┐          ┌──────────────┐
      │  ARCHITECT  ├──────────►   AI CHAT    │
      │(Plan & Goal)│          │ (General Q&A)│
      └──────┬──────┘          └──────────────┘
             │
      ┌──────▼──────┐          ┌──────────────┐
      │    TUTOR    ├──────────► PRESENTATION │
      │(Teach & Ask)│          │ & AUDIO (TTS)│
      └──────┬──────┘          └──────────────┘
             │
      ┌──────▼──────┐          ┌──────────────┐
      │   ASSESSOR  │◄─────────┤   PAYMENTS   │
      │(Quiz & Gate)│          │ (402 Limits) │
      └──────┬──────┘          └──────────────┘
             │
      ┌──────▼──────┐          ┌──────────────┐
      │ SYNTHESIZER ├──────────► CERTIFICATION│
      │ (Summarize) ├──────────►  FLASHCARDS  │
      └─────────────┘          └──────────────┘
```


## Technical Stack & Architecture

- **Frontend**: React 19, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend**: FastAPI (Python), SQLAlchemy (Async), MySQL
- **AI Engine**: LangChain Multi-Agent Framework, Multi-modal LLMs (JSON/Multipart), Groq API, 
- **APIs & Services**: Chapa (Payments), YouTube Search, Google Web Search, Translate



---
*Developed for the Future of Autonomous Education*  
© 2026 AI Tutor Platform.
