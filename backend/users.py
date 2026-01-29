"""User storage for LLM Council authentication."""

import json
import os
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path

# Users file path
USERS_FILE = "data/users.json"


def ensure_users_file():
    """Ensure the users file exists."""
    Path("data").mkdir(parents=True, exist_ok=True)
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w') as f:
            json.dump({}, f)


def load_users() -> Dict[str, Any]:
    """Load all users from storage."""
    ensure_users_file()
    with open(USERS_FILE, 'r') as f:
        return json.load(f)


def save_users(users: Dict[str, Any]):
    """Save users to storage."""
    ensure_users_file()
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a user by their ID.

    Args:
        user_id: User's unique identifier (Google sub)

    Returns:
        User dict or None if not found
    """
    users = load_users()
    return users.get(user_id)


def get_or_create_user(
    user_id: str,
    email: str,
    name: str,
    picture: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get an existing user or create a new one.

    Args:
        user_id: User's unique identifier (Google sub)
        email: User's email address
        name: User's display name
        picture: URL to user's profile picture

    Returns:
        User dict
    """
    users = load_users()
    
    if user_id in users:
        # Update user info (in case it changed)
        users[user_id]["email"] = email
        users[user_id]["name"] = name
        users[user_id]["picture"] = picture
        users[user_id]["last_login"] = datetime.utcnow().isoformat()
        save_users(users)
        return users[user_id]
    
    # Create new user
    user = {
        "id": user_id,
        "email": email,
        "name": name,
        "picture": picture,
        "created_at": datetime.utcnow().isoformat(),
        "last_login": datetime.utcnow().isoformat()
    }
    users[user_id] = user
    save_users(users)
    
    return user
