from __future__ import annotations

from langchain_core.messages import AIMessage

from models.state import PsyState

REFUSE_ACK_REPLIES = [
    "完全理解，做不做测试完全由你决定。我们继续聊就好，你想从哪里说起？",
    "好的，没问题。测试只是一种方式，我们可以用自己舒服的节奏来。你现在最想聊什么？",
    "收到，不强求。你愿意继续说说最近的感受吗？我在听。",
]


def lock_node(state: PsyState) -> dict:
    """Acknowledge test refusal and optionally lock further recommendations."""
    refuse_count = state.get("refuse_count", 0) + 1
    scale_locked = refuse_count >= 2

    # Show the first template on the first refusal.
    reply = REFUSE_ACK_REPLIES[(refuse_count - 1) % len(REFUSE_ACK_REPLIES)]

    return {
        "refuse_count": refuse_count,
        "scale_locked": scale_locked,
        "reply": reply,
        "messages": [AIMessage(content=reply)],
        "recommended_scales": [],
        "turn_count": state.get("turn_count", 0) + 1,
        "last_node": "lock",
    }
