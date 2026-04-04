# � AI Tutor — Multi-Agent Autonomous Learning System

> **Four specialized AI agents collaborate to plan, teach, evaluate, and synthesize — creating a fully adaptive, closed-loop learning experience from a single prompt.**

AI Tutor dynamically generates entire courses, lessons, quizzes, and flashcards tailored to each learner's goals, pace, and knowledge level — powered by **LangChain multi-agent orchestration**, **FastAPI**, and **React 19**.

---

## ✨ Key Features

- 🏗️ **AI Course Generation** — Describe a goal → get a full day-by-day curriculum instantly
- 📚 **Adaptive Lessons** — Rich content with text, code, images, and embedded YouTube videos
- 💬 **In-Lesson Q&A** — Context-aware answers tied to current lesson material
- 📝 **Intelligent Quizzes** — multiple choice, True/False, Fill-in-the-blank, Short Answer with mastery gating
- 🃏 **Smart Flashcards** — Auto-generated with difficulty ratings for spaced repetition
- 📊 **Progress Analytics** — Mastery scores, activity timelines, course-level breakdowns
- 🎤 **Voice I/O** — Hands-free learning via speech-to-text and text-to-speech
- 🔍 **Live Tools** — Web search, YouTube, image search, translation, calculator — all mid-lesson
- 🌐 **Multi-Language** — Native language awareness for personalized explanations

---

## 🧠 Multi-Agent Architecture

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

1. **Architect** — Iteratively converses with the learner to understand goals, skill level, and time constraints, then generates a structured course plan.
2. **Tutor** — Generates lesson content using live tools (web, YouTube, images, translation) and answers learner questions in context.
3. **Assessor** — Creates quizzes, evaluates responses with explanations, and decides if the learner can progress.
4. **Synthesizer** — Summarizes lessons, generates flashcards, records progress, and unlocks the next lesson.
