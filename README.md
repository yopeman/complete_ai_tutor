# Complete AI Tutor Platform

## Multi-Agent System

### The Architect

- planning and curriculum

### The Tutor

- generate content and explain it
- answer learner questions

### The Assessor

- evaluate students and decide to pass to next lesson or not

### The Synthesizer

- summarize and flashcard generator

## Workflows

- USER: signup/login
- USER: create new course to learn it
- USER: insert its current status, goal, objective, time constraints (e.g. for 3 months and 3 day per week), etc...
- ARCHITECT: ask a user more information if unclear and not have enough information to plan. this process it done in iterative way until agent acquire enough information to planing and curriculum generation
- ARCHITECT: plan topic for each day has in user time constraint
- ARCHITECT & USER: user review the plan and agent improve in iterative way until it meet user needs
- TUTOR: generate learning content and teach the learner
- TUTOR & USER: learner ask agent answer this question in iterative way until user understand it
- ASSESSOR: generate quiz and ask learner. and evaluate learner. give short answer if learner make mistake. decide if learner go next or not. if not write prompt to for tutor agent and learner must be learn again
- SYNTHESIZER: before learner go to next lesson summarize current lesson, record progress, and store it. this stored summary are later use tutor agent to create smooths teaching system
- SYNTHESIZER: generate flashcard
- SYSTEM: after completing all lessons the system generate completion summary and generate certificate.

## Allowed Tools for an Agent

- web search
- image search
- YouTube video search
- google translator
- calculator

## Tech Stack

- Python/FastAPI
- LangChain/LangGraph
- React
- MySQL+SQLAlchemy

## Database Schema

### users

- id
- username
- password hash
- native language
- timestamp (created at & updated at)

### courses

- id
- user id
- title
- description
- difficulty
- goal (string)
- objectives (array)
- estimated duration days (int)
- status: active, completed, cancelled
- course plan (e.g. day 1 learn introduction)
- timestamp

### lessons

- id
- course id
- day number (e.g. day 1)
- title
- daily plan (e.g. today learn about topic 1, topic 2, topic 3)
- content
- summary
- status: not started, in progress, completed
- is locked
- timestamp

### interactions

- id
- lesson id
- user question
- AI answer
- timestamp

### quizzes

- id
- lesson id
- session id
- question
- options
- correct answer
- student answer
- is correct
- type: multiple choice, true false, fill blank space, short answers
- timestamp

### progress

- id
- lesson id
- quiz score
- is passed
- student's current status (e.g. student good at theoretical understanding but it are poor practical scenarios)
- timestamp

### flashcards

- id
- lesson id
- front
- back
- difficulty
- timestamp

### chats

- id
- user id
- session id
- prompt
- response
- timestamp

## RESTful Endpoints

POST /register

POST /login

GET /me

POST /courses

GET /courses

GET /courses/{course id}

GET /courses/{course id}/lessons

GET /lessons

GET /lessons/{lesson id}

GET /lessons/{lesson id}/interactions

GET /lessons/{lesson id}/quizzes

GET /lessons/{lesson id}/progress

GET /lessons/{lesson id}/flashcards

GET /interactions

GET /interactions/{interaction id}

GET /quizzes

GET /quizzes/{quiz id}

GET /progress

GET /progress/{progress id}

GET /flashcards

GET /flashcards/{flashcard id}
