# AI Tutor — Multi-Agent Autonomous Learning System

> Four specialized AI agents collaborate to plan, teach, evaluate, and synthesize — creating a fully adaptive, closed-loop learning experience from a single prompt.

AI Tutor dynamically generates entire courses, lessons, quizzes, and flashcards tailored to each learner's goals, pace, and knowledge level — powered by **LangChain multi-agent orchestration**, **FastAPI**, and **React 19**.

---

## Key Features

### Personalized Course Architecture
- The AI Architect engages in an **iterative conversation** to understand the learner's current skill level, goals, available time (e.g. "3 months, 3 days/week"), and preferred learning style
- Generates a **complete day-by-day curriculum** adapted to the learner's starting point — not a one-size-fits-all template
- The learner can **review and refine** the plan collaboratively with the AI before committing

### Rich Adaptive Lesson Content
- Each lesson is **dynamically generated** with in-depth explanations, real code examples, diagrams, and embedded YouTube tutorial videos
- Content is **context-aware** — the Tutor considers previous lesson summaries and the student's recorded strengths/weaknesses when generating new material
- Learners can ask **follow-up questions** mid-lesson and receive answers grounded in the current lesson context

### Locked Lesson Progression
- Lessons follow a **sequential mastery model** — each lesson is locked until the previous one is completed and evaluated
- Progression is **gated by quiz performance**, not just completion — the Assessor must confirm the learner has achieved sufficient understanding before unlocking the next lesson
- This prevents skipping ahead and ensures **genuine comprehension** at every stage

### Intelligent Multi-Format Evaluation
- The Assessor generates **contextual quizzes** in multiple formats: Multiple Choice, True/False, Fill-in-the-blank, and Short Answer
- Each response is **evaluated with detailed explanations** — the learner understands *why* an answer is correct or incorrect
- The system records the **student's performance profile** (e.g. "strong theoretical understanding, weak in practical application") and feeds this back into future teaching

### Smart Flashcard Generation
- The Synthesizer auto-generates **spaced-repetition flashcards** from each completed lesson with difficulty ratings (Easy, Medium, Hard)
- Flashcards feature a full **study mode** with card flipping, confidence rating, and progress tracking

### Progress Analytics Dashboard
- Tracks mastery scores, completed lessons, average quiz performance, and activity timelines across all courses
- Provides a **command center view** with continue-learning shortcuts, recent activity, and quick-access actions

### Voice Interaction
- Full **speech-to-text** input — ask questions, create courses, and refine plans using voice
- **Text-to-speech** output — listen to AI responses and lesson content hands-free

### Live Agent Tools
- Agents autonomously use **5 real-time tools** during content generation:
  - **Web Search** — current information and documentation
  - **YouTube Search** — finds and embeds relevant tutorial videos
  - **Image Search** — retrieves visual aids and diagrams
  - **Google Translate** — explains concepts in the learner's native language
  - **Calculator** — performs computations for STEM content

---

## Multi-Agent Architecture

```
  USER ─────────┬──────────────────────────┐
                │                          │
         ┌──────▼──────┐           ┌───────▼───────┐
         │  ARCHITECT  │           │   AI CHAT     │
         │  Plans &    │           │  (Free-form)  │
         │  curricula  │           │   Any topic   │
         └──────┬──────┘           └───────────────┘
                │
         ┌──────▼──────┐
         │   TUTOR     │  ← Web Search, YouTube,
         │  Teaches &  │    Images, Translate
         │  answers    │
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │  ASSESSOR   │
         │  Quizzes &  │
         │  evaluates  │
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │ SYNTHESIZER │
         │ Summarizes, │
         │ flashcards, │
         │ unlocks next│
         └─────────────┘
```

**How they collaborate:**

1. **Architect** — Iteratively converses with the learner to understand goals, skill level, and time constraints, then generates a structured course plan tailored to their current status.
2. **Tutor** — Generates lesson content using live tools (web, YouTube, images, translation), considers the student's performance history, and answers questions in context.
3. **Assessor** — Creates quizzes, evaluates responses with explanations, records the student's skill profile, and gates progression — only unlocking the next lesson upon demonstrated mastery.
4. **Synthesizer** — Summarizes lessons, generates difficulty-rated flashcards, records progress analytics, and manages the lesson unlock sequence.
