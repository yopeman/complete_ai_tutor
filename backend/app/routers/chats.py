from fastapi import APIRouter, Depends, Query, status, Form, File, UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.tts_and_stt import transcribe_uploaded_file
from typing import List
from app.database import get_db
from app.dependencies import get_current_active_user
from app.models import User
from app.schemas import ChatCreate, ChatResponse, ChatListResponse
from app.config import get_settings
from app.controllers.chats import (
    get_chats as get_chats_controller,
    create_chat as create_chat_controller,
    get_chat as get_chat_controller,
)

router = APIRouter(prefix="/chats", tags=["Chats"])



@router.get("", response_model=List[ChatListResponse])
async def get_chats(
    session_id: str = Query(None, description="Filter by session ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all chats for the current user."""
    return await get_chats_controller(session_id, skip, limit, current_user, db)


# ..._@
@router.post("", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
async def create_chat(
    prompt: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    audio_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    settings = Depends(get_settings)
):
    """Create a new chat and generate an AI response using Groq."""
    if not prompt and not audio_file:
        raise HTTPException(status_code=400, detail="Either prompt or audio_file must be provided")
    
    if not prompt and audio_file:
        prompt = await transcribe_uploaded_file(audio_file)
        
    chat_data = ChatCreate(prompt=prompt, session_id=session_id)
    return await create_chat_controller(chat_data, current_user, db, settings)


@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(
    chat_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific chat by ID."""
    return await get_chat_controller(chat_id, current_user, db)
