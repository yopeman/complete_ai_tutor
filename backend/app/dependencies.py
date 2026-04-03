from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.auth_service import decode_token, get_user_by_id
from app.schemas import TokenPayload
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Dependency to get the current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = decode_token(token)
    
    if token_data is None or token_data.sub is None:
        raise credentials_exception
    
    if token_data.type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await get_user_by_id(db, token_data.sub)
    
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency to get the current active user."""
    # Add additional checks here if needed (e.g., user.is_active)
    return current_user
