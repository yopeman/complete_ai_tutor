from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
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


@router.post("", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
async def create_chat(
    chat_data: ChatCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    settings = Depends(get_settings)
):
    """Create a new chat and generate an AI response using Groq."""
    return await create_chat_controller(chat_data, current_user, db, settings)


@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(
    chat_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific chat by ID."""
    return await get_chat_controller(chat_id, current_user, db)
