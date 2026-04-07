from __future__ import annotations

import json

from langchain_core.messages import HumanMessage, SystemMessage

from dependencies import fetch_conversation_messages, fetch_user_profile, upsert_user_profile
from llm.client import get_llm
from llm.prompts import SYSTEM_SUMMARY


async def run_session_summary(session_id: int) -> None:
    """Background task: summarize a conversation and update user profile."""
    messages = await fetch_conversation_messages(session_id)
    if not messages:
        return

    first_msg = messages[0] if messages else {}
    from dependencies import get_flask_client
    client = get_flask_client()
    resp = await client.get(f"/api/internal/conversation/{session_id}/messages")
    if resp.status_code != 200:
        return

    data = resp.json()
    user_id = data.get("user_id")
    if not user_id:
        return

    conversation_text = "\n".join(
        f"{m['role']}: {m['content']}" for m in messages
    )

    llm = get_llm(use_thinking=False)

    try:
        response = await llm.ainvoke([
            SystemMessage(content=SYSTEM_SUMMARY),
            HumanMessage(content=conversation_text),
        ])
        raw = response.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.rstrip("`").strip()

        parsed = json.loads(raw)
    except Exception:
        return

    existing = await fetch_user_profile(user_id)
    old_summary = existing.get("history_summary") or ""
    session_summary = parsed.get("session_summary", "")
    new_summary = f"{old_summary}\n---\n{session_summary}".strip() if old_summary else session_summary

    old_concerns = existing.get("core_concerns") or []
    new_concerns = parsed.get("core_concerns", [])
    merged_concerns = list(set(old_concerns + new_concerns))

    profile_update = {
        "persona": parsed.get("persona") or existing.get("persona"),
        "communication_style": parsed.get("communication_style") or existing.get("communication_style"),
        "core_concerns": merged_concerns,
        "history_summary": new_summary,
    }

    await upsert_user_profile(user_id, profile_update)
