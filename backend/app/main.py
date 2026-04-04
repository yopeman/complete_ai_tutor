from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.database import engine, Base
from app.routers import auth, courses, lessons, interactions, quizzes, progress, flashcards, chats, tts_and_stt, presentations
from app.config import get_settings
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
settings = get_settings()
os.makedirs(settings.audio_cache_dir, exist_ok=True)


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
    allow_origins=["*"],
    allow_credentials=False, # Credentials not needed for Bearer tokens
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, tags=["Authentication"])
app.include_router(courses.router, tags=["Courses"])
app.include_router(lessons.router, tags=["Lessons"])
app.include_router(presentations.router, tags=["Presentations"])
app.include_router(interactions.router, tags=["Interactions"])
app.include_router(quizzes.router, tags=["Quizzes"])
app.include_router(progress.router, tags=["Progress"])
app.include_router(flashcards.router, tags=["Flashcards"])
app.include_router(chats.router, tags=["Chats"])
app.include_router(tts_and_stt.router, tags=["TTS and STT"])


# Serve static files
app.mount("/audio_cache", StaticFiles(directory=settings.audio_cache_dir), name=settings.audio_cache_dir)


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
