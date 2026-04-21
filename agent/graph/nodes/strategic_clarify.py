
from __future__ import annotations

from langchain_core.messages import AIMessage

try:
    from models.state import PsyState
except ModuleNotFoundError:
    from agent.models.state import PsyState


def strategic_clarify_node(state: PsyState) -> dict:
    evidence = state.get("evidence", {}) or {}
    question = state.get("follow_up_question", "") or "如果只抓一个最困扰你的点，它更接近哪一种表现？"
    direct = evidence.get("direct_signals", [])
    observation = "我先抓到几个比较关键的线索"
    if direct:
        observation = "我先抓到你提到的重点：" + "、".join(direct[:3])

    reply = (
        f"{observation}。目前我已经能缩小到一小类更合适的量表，"
        f"但还差一个判断点。\n\n{question}"
    )
    return {
        "reply": reply,
        "messages": [AIMessage(content=reply)],
        "turn_count": state.get("turn_count", 0) + 1,
        "last_node": "strategic_clarify",
    }
