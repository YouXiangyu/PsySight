from __future__ import annotations

from typing import Annotated, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class PsyState(TypedDict):
    """LangGraph 全局共享状态."""

    # ── 消息上下文 (LangGraph 自动追加) ──
    messages: Annotated[list[BaseMessage], add_messages]

    # ── 会话标识 ──
    session_id: int | None
    turn_count: int

    # ── 用户身份 ──
    user_id: int | None
    is_anonymous: bool
    user_profile: dict

    # ── 前端控制参数 ──
    use_thinking: bool
    search_mode: str  # "index" | "rag"

    # ── 意图路由 ──
    intent: str  # chat / want_test / refuse_test / crisis / greeting

    # ── 量表推荐控制 ──
    scale_locked: bool
    refuse_count: int
    recommendation_cooldown: int

    # ── 症状提取 (跨轮累积) ──
    extracted_symptoms: list[str]

    # ── 检索结果 ──
    rag_results: list[dict]

    # ── 危机状态 ──
    crisis_detected: bool
    crisis_keywords: list[str]

    # ── 节点输出 ──
    reply: str
    recommended_scales: list[dict]

    # ── 调试 ──
    last_node: str
