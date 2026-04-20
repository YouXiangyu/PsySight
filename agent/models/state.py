from __future__ import annotations

from typing import Annotated, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class PsyState(TypedDict):
    """Shared LangGraph state."""

    messages: Annotated[list[BaseMessage], add_messages]

    session_id: int | None
    turn_count: int

    user_id: int | None
    is_anonymous: bool
    user_profile: dict

    use_thinking: bool
    search_mode: str  # "index" | "rag"

    intent: str  # chat / want_test / refuse_test / crisis / greeting

    scale_locked: bool
    refuse_count: int
    recommendation_cooldown: int

    extracted_symptoms: list[str]
    latent_needs: list[str]
    scale_scores: dict[str, float]

    rag_results: list[dict]

    crisis_detected: bool
    crisis_keywords: list[str]

    reply: str
    recommended_scales: list[dict]
    conversation_goal: str
    follow_up_question: str

    last_node: str
