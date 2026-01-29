"""Authentication module for LLM Council."""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, status
from jose import JWTError, jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from .config import (
    GOOGLE_CLIENT_ID,
    JWT_SECRET,
    JWT_ALGORITHM,
    JWT_EXPIRATION_HOURS
)
from . import users


# Cookie name for session
SESSION_COOKIE_NAME = "llm_council_session"


def verify_google_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify a Google ID token and extract user info.

    Args:
        token: Google ID token from frontend

    Returns:
        Dict with user info (sub, email, name, picture) or None if invalid
    """
    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
        
        # Verify the token is from Google
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            return None
        
        return {
            "sub": idinfo["sub"],
            "email": idinfo.get("email"),
            "name": idinfo.get("name"),
            "picture": idinfo.get("picture")
        }
    except ValueError as e:
        print(f"Google token verification failed: {e}")
        return None


def create_session_token(user_id: str) -> str:
    """
    Create a JWT session token for a user.

    Args:
        user_id: User's unique identifier

    Returns:
        JWT token string
    """
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_session_token(token: str) -> Optional[str]:
    """
    Verify a session token and return the user ID.

    Args:
        token: JWT session token

    Returns:
        User ID or None if invalid
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


def get_session_cookie(request: Request) -> Optional[str]:
    """
    Get the session token from request cookies.

    Args:
        request: FastAPI request object

    Returns:
        Session token or None
    """
    return request.cookies.get(SESSION_COOKIE_NAME)


async def get_current_user(request: Request) -> Optional[Dict[str, Any]]:
    """
    Get the current authenticated user from request.
    
    This is a dependency that can be used in routes.

    Args:
        request: FastAPI request object

    Returns:
        User dict or None if not authenticated
    """
    token = get_session_cookie(request)
    if not token:
        return None
    
    user_id = verify_session_token(token)
    if not user_id:
        return None
    
    return users.get_user_by_id(user_id)


async def require_auth(request: Request) -> Dict[str, Any]:
    """
    Require authentication for a route.
    
    This is a dependency that raises 401 if not authenticated.

    Args:
        request: FastAPI request object

    Returns:
        User dict

    Raises:
        HTTPException: If not authenticated
    """
    user = await get_current_user(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return user
