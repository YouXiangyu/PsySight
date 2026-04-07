from __future__ import annotations

import logging
import re

from langchain_core.messages import AIMessage

from models.state import PsyState
from retrieval.scale_index import get_scale_index_search
from retrieval.scale_rag import get_scale_rag

logger = logging.getLogger(__name__)


def _extract_keywords_from_message(text: str) -> list[str]:
    """Extract potential psychological keywords from the user's current message."""
    keyword_pool = [
        "睡眠", "失眠", "入睡", "早醒", "嗜睡", "疲惫", "疲劳", "累",
        "焦虑", "紧张", "担心", "恐惧", "害怕", "不安",
        "抑郁", "低落", "难过", "悲伤", "绝望", "无助", "空虚",
        "压力", "烦躁", "愤怒", "暴躁",
        "注意力", "专注", "分心", "记忆",
        "人际", "社交", "孤独", "关系",
        "自尊", "自信", "自卑",
        "强迫", "反复", "控制不住",
        "饮食", "暴食", "厌食", "体重",
        "情绪", "心情", "感受",
    ]
    return [kw for kw in keyword_pool if kw in text]


def test_handoff_node(state: PsyState) -> dict:
    """User wants to take a test — recommend scales and provide links."""
    symptoms = list(state.get("extracted_symptoms", []))

    last_msg = state["messages"][-1]
    user_text = last_msg.content if hasattr(last_msg, "content") else str(last_msg)
    msg_keywords = _extract_keywords_from_message(user_text)
    search_terms = list(set(symptoms + msg_keywords))

    results: list[dict] = []
    if search_terms:
        if state.get("search_mode") == "rag":
            try:
                rag = get_scale_rag()
                results = rag.search(" ".join(search_terms), top_k=3)
            except Exception:
                logger.warning("RAG search failed, falling back to index search")

        if not results:
            search = get_scale_index_search()
            results = search.search(search_terms, top_k=3)

    if results:
        scale_lines = [f"- **{s['title']}** → /scale/{s['code']}" for s in results]
        reply = (
            "好的，根据我们的对话，这几个量表可能适合你：\n"
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
