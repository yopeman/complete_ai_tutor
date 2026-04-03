from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import auth, courses, lessons, interactions, quizzes, progress, flashcards, chats


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup: Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    # Shutdown: Close database connection
    await engine.dispose()


app = FastAPI(
    title="AI Tutor Platform API",
    description="Multi-Agent AI Tutor Platform with FastAPI and MySQL",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, tags=["Authentication"])
app.include_router(courses.router, tags=["Courses"])
app.include_router(lessons.router, tags=["Lessons"])
app.include_router(interactions.router, tags=["Interactions"])
app.include_router(quizzes.router, tags=["Quizzes"])
app.include_router(progress.router, tags=["Progress"])
app.include_router(flashcards.router, tags=["Flashcards"])
app.include_router(chats.router, tags=["Chats"])


@app.get("/")
async def root():
    return {
        "message": "AI Tutor Platform API",
        "version": "0.1.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
