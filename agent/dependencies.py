from functools import lru_cache

import httpx

from config import FLASK_INTERNAL_URL, INTERNAL_API_TOKEN


@lru_cache(maxsize=1)
def get_flask_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        base_url=FLASK_INTERNAL_URL,
        headers={"X-Internal-Token": INTERNAL_API_TOKEN},
        timeout=15.0,
    )


async def fetch_user_profile(user_id: int) -> dict:
    client = get_flask_client()
    resp = await client.get(f"/api/internal/user-profile/{user_id}")
    if resp.status_code == 200:
        return resp.json()
    return {}


async def fetch_conversation_messages(session_id: int) -> list[dict]:
    client = get_flask_client()
    resp = await client.get(f"/api/internal/conversation/{session_id}/messages")
    if resp.status_code == 200:
        return resp.json().get("items", [])
    return []


async def save_conversation_to_flask(
    user_id: int | None,
    session_id: int | None,
    messages: list[dict],
) -> dict:
    client = get_flask_client()
    resp = await client.post(
        "/api/internal/save-conversation",
        json={"user_id": user_id, "session_id": session_id, "messages": messages},
    )
    if resp.status_code == 200:
        return resp.json()
    return {}


async def upsert_user_profile(user_id: int, profile_data: dict) -> bool:
    client = get_flask_client()
    resp = await client.post(
        "/api/internal/user-profile",
        json={"user_id": user_id, **profile_data},
    )
    return resp.status_code == 200
