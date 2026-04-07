from __future__ import annotations

from langchain_core.messages import AIMessage

from models.state import PsyState
from retrieval.scale_index import get_scale_index_search


def test_handoff_node(state: PsyState) -> dict:
    """User wants to take a test — recommend scales and provide links."""
    symptoms = state.get("extracted_symptoms", [])
    search = get_scale_index_search()
    results = search.search(symptoms, top_k=3) if symptoms else []

    if results:
        scale_lines = [f"- **{s['title']}** → /scale/{s['code']}" for s in results]
        reply = (
            "好的，根据我们之前的对话，这几个量表可能适合你：\n"
            + "\n".join(scale_lines)
            + "\n\n你可以点击上面的链接进入测评页面。做完之后我们可以继续聊。"
        )
    else:
        reply = (
            "好的，你可以去量表库页面浏览所有可用的量表，选一个你感兴趣的。"
            "做完之后回来告诉我，我们可以一起看看结果。"
        )

    recommended = [
        {"code": s["code"], "title": s["title"], "scale_id": s.get("scale_id")}
        for s in results
    ]

    return {
        "reply": reply,
        "messages": [AIMessage(content=reply)],
        "recommended_scales": recommended,
        "turn_count": state.get("turn_count", 0) + 1,
        "last_node": "test_handoff",
    }
