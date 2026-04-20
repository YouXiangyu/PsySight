from __future__ import annotations

import json
import re

from langchain_core.messages import HumanMessage, SystemMessage

from llm.client import get_router_llm
from llm.prompts import SYSTEM_ROUTER
from models.state import PsyState
from recommendation.engine import analyze_message

REFUSE_TEST_PATTERNS = [
    r"不想(做|测|答)",
    r"先不做",
    r"别推(荐)?(量表|测试|问卷)",
    r"不要(量表|测试|问卷)",
]

GREETING_PATTERNS = [
    r"^(你好|嗨|hello|hi)\s*$",
    r"^(在吗|有人吗)\s*$",
]


def _intent_from_rules(user_text: str) -> str | None:
    normalized = (user_text or "").strip().lower()
    if not normalized:
        return "greeting"

    if any(re.search(pattern, normalized) for pattern in GREETING_PATTERNS):
        return "greeting"

    if any(re.search(pattern, normalized) for pattern in REFUSE_TEST_PATTERNS):
        return "refuse_test"

    analysis = analyze_message(normalized)
    if analysis.get("explicit_request"):
        return "want_test"

    return None


async def router_node(state: PsyState) -> dict:
    """Classify user intent with a rule-first, LLM-second strategy."""
    last_msg = state["messages"][-1]
    user_text = last_msg.content if hasattr(last_msg, "content") else str(last_msg)

    intent = _intent_from_rules(user_text)
    if intent:
        return {
            "intent": intent,
            "last_node": "router",
        }

    llm = get_router_llm()

    try:
        response = await llm.ainvoke([
            SystemMessage(content=SYSTEM_ROUTER),
            HumanMessage(content=user_text),
        ])
        raw = (response.content or "").strip()

        if raw.startswith("```"):
            raw = raw.split("```", 1)[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.rstrip("`").strip()

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
