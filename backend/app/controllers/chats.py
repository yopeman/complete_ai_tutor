from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from app.database import get_db
from app.dependencies import get_current_active_user
from app.models import User, Chat
from app.schemas import ChatCreate, ChatResponse, ChatListResponse
from app.config import get_thinking_llm
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain.agents import create_agent
from app.services.tutor_tools import TUTOR_TOOLS


async def verify_chat_access(chat_id: int, user_id: int, db: AsyncSession) -> Chat:
    """Verify that a chat belongs to the user."""
    result = await db.execute(
        select(Chat).where(Chat.id == chat_id, Chat.user_id == user_id)
    )
    chat = result.scalar_one_or_none()
    
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found"
        )
    
    return chat


async def get_chats(
    session_id: str = Query(None, description="Filter by session ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all chats for the current user."""
    if session_id:
        # Filter by specific session_id
        query = select(Chat).where(
            Chat.user_id == current_user.id,
            Chat.session_id == session_id
        )
    else:
        # Get one record (the latest) per distinct session_id
        subquery = (
            select(func.max(Chat.id))
            .where(Chat.user_id == current_user.id)
            .group_by(Chat.session_id)
        )
        query = select(Chat).where(Chat.id.in_(subquery))
    
    query = query.order_by(Chat.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    chats = result.scalars().all()
    
    return chats


async def create_chat(
    chat_data: ChatCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new chat and generate an AI response using an AI Agent with tools."""
    
    # 1. Initialize Groq LLM
    llm = get_thinking_llm()
    
    # 2. Fetch conversation history from the same session
    history_query = select(Chat).where(
        Chat.user_id == current_user.id,
        Chat.session_id == chat_data.session_id
    ).order_by(Chat.created_at.desc()).limit(10)
    
    history_result = await db.execute(history_query)
    history = list(reversed(history_result.scalars().all()))
    
    # 3. Build agent and prompt
    system_prompt = (
        f"You are a helpful AI assistant in an AI tutor platform. "
        f"The user's name is {current_user.username} and their native language is {current_user.native_language or 'English'}. "
        f"Be educational and encouraging. You have access to various tools to help you answer questions."
    )
    
    # 4. Initialize agent
    try:
        agent = create_agent(
            model=llm,
            tools=TUTOR_TOOLS,
            system_prompt=system_prompt
        )
        
        # 5. Convert history to messages format
        messages = []
        for chat_item in history:
            messages.append(HumanMessage(content=chat_item.prompt))
            messages.append(AIMessage(content=chat_item.response))
            
        # Append latest prompt
        messages.append(HumanMessage(content=chat_data.prompt))
            
        # 6. Run agent
        result = await agent.ainvoke({"messages": messages})
        
        # Extract the AI response from the last message in result
        last_message = result.get("messages", [])[-1]
        ai_response = last_message.content if getattr(last_message, 'content', None) else "I apologize, I could not generate a response."
        
    except Exception as e:
        ai_response = f"I apologize, I encountered an error while processing your request: {str(e)}"
    
    # 7. Save and return
    db_chat = Chat(
        user_id=current_user.id,
        session_id=chat_data.session_id,
        prompt=chat_data.prompt,
        response=ai_response
    )
    
    db.add(db_chat)
    await db.commit()
    await db.refresh(db_chat)
    
    return db_chat


async def get_chat(
    chat_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific chat by ID."""
    chat = await verify_chat_access(chat_id, current_user.id, db)
    return chat


async def delete_chat(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete all chats for a specific session ID belonging to the user."""
    from sqlalchemy import delete
    
    query = delete(Chat).where(
        Chat.user_id == current_user.id,
        Chat.session_id == session_id
    )
    
    await db.execute(query)
    await db.commit()
    
    return None
