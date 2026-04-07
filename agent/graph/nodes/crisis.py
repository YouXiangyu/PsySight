from __future__ import annotations

from langchain_core.messages import AIMessage

from llm.prompts import CRISIS_RESPONSE_TEMPLATE
from models.state import PsyState

CRISIS_KEYWORDS = [
    "自杀", "自残", "不想活", "结束生命", "跳楼",
    "割腕", "轻生", "去死", "想死",
]


def crisis_node(state: PsyState) -> dict:
    """Check the latest user message for crisis keywords. Pure rules, zero latency."""
    last_msg = state["messages"][-1]
    content = last_msg.content if hasattr(last_msg, "content") else str(last_msg)

    matched = [kw for kw in CRISIS_KEYWORDS if kw in content]

    if matched:
        return {
            "crisis_detected": True,
            "crisis_keywords": matched,
            "intent": "crisis",
            "reply": CRISIS_RESPONSE_TEMPLATE,
            "messages": [AIMessage(content=CRISIS_RESPONSE_TEMPLATE)],
            "last_node": "crisis",
        }

    return {
        "crisis_detected": False,
        "crisis_keywords": [],
        "last_node": "crisis",
    }
