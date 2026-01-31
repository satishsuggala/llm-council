"""Memory management using Mem0."""

import os
from typing import List, Dict, Any
from mem0 import Memory
from .config import OPENROUTER_API_KEY

# Initialize Mem0 with OpenRouter and HuggingFace
config = {
    "llm": {
        "provider": "openai",
        "config": {
            "api_key": OPENROUTER_API_KEY,
            "openai_base_url": "https://openrouter.ai/api/v1",
            "model": "google/gemini-2.0-flash-001",
        }
    },
    "embedder": {
        "provider": "huggingface",
        "config": {
            "model": "multi-qa-MiniLM-L6-cos-v1"
        }
    }
}

# Global memory instance
memory = Memory.from_config(config)


import asyncio

# ... imports ... (memory is global)

async def get_relevant_memories(user_id: str, query: str, limit: int = 3) -> str:
    """
    Search for relevant memories for a user (async).
    """
    try:
        results = await asyncio.to_thread(memory.search, query=query, user_id=user_id, limit=limit)
        
        # Check if results is a dict with 'results' key or list
        memories_list = results.get("results", []) if isinstance(results, dict) else results
        
        if not memories_list:
            return ""
            
        formatted_memories = "\n".join([f"- {m['memory']}" for m in memories_list])
        return formatted_memories
    except Exception as e:
        print(f"Error searching memories: {e}")
        return ""


async def add_interaction(user_id: str, query: str, response: str):
    """
    Add a user-assistant interaction to memory (async).
    """
    try:
        messages = [
            {"role": "user", "content": query},
            {"role": "assistant", "content": response}
        ]
        await asyncio.to_thread(memory.add, messages, user_id=user_id)
    except Exception as e:
        print(f"Error adding memory: {e}")
