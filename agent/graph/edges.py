
from __future__ import annotations

from typing import Literal

try:
    from models.state import PsyState
except ModuleNotFoundError:
    from agent.models.state import PsyState


def after_crisis(state: PsyState) -> Literal["crisis_end", "router"]:
    if state.get("crisis_detected"):
        return "crisis_end"
    return "router"


def after_router(state: PsyState) -> Literal["lock", "evidence_extractor"]:
    intent = state.get("intent", "chat")
    if intent == "refuse_test":
        return "lock"
    return "evidence_extractor"


def after_recommendation_planner(state: PsyState) -> Literal["direct_recommend", "strategic_clarify", "empathy"]:
    action = state.get("policy_action", "empathy")
    if action == "direct_recommend":
        return "direct_recommend"
    if action == "strategic_clarify":
        return "strategic_clarify"
    return "empathy"
