from __future__ import annotations

import json

from langchain_core.messages import HumanMessage, SystemMessage

from llm.client import get_router_llm
from llm.prompts import SYSTEM_ROUTER
from models.state import PsyState


async def router_node(state: PsyState) -> dict:
    """Classify user intent using LLM structured output."""
    last_msg = state["messages"][-1]
    user_text = last_msg.content if hasattr(last_msg, "content") else str(last_msg)

    llm = get_router_llm()

    try:
        response = await llm.ainvoke([
            SystemMessage(content=SYSTEM_ROUTER),
            HumanMessage(content=user_text),
        ])
        raw = response.content.strip()

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        parsed = json.loads(raw)
        intent = parsed.get("intent", "chat")
        if intent not in ("chat", "want_test", "refuse_test", "greeting"):
            intent = "chat"
    except Exception:
        intent = "chat"

    return {
        "intent": intent,
        "last_node": "router",
    }
