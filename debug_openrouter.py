import asyncio
import os
from dotenv import load_dotenv
from backend.openrouter import query_model

load_dotenv()

async def main():
    print("Querying model...")
    response = await query_model(
        "google/gemini-2.5-flash", 
        [{"role": "user", "content": "Hi"}]
    )
    print("Response keys:", response.keys() if response else "None")
    
    # I need to see the raw response in openrouter.py, but I can't modify it just for this.
    # So I will copy the code from openrouter.py into here and modify it to print raw json.

    import httpx
    from backend.config import OPENROUTER_API_KEY, OPENROUTER_API_URL

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "google/gemini-2.5-flash",
        "messages": [{"role": "user", "content": "Hi"}],
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            OPENROUTER_API_URL,
            headers=headers,
            json=payload
        )
        print("Status:", resp.status_code)
        data = resp.json()
        import json
        print(json.dumps(data, indent=2))
        
        # Check for headers that might match cost
        print("\nHeaders:")
        for k, v in resp.headers.items():
            if "cost" in k.lower() or "price" in k.lower():
                print(f"{k}: {v}")

if __name__ == "__main__":
    asyncio.run(main())
