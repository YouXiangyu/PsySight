from __future__ import annotations

from typing import Literal

from models.state import PsyState


def after_crisis(state: PsyState) -> Literal["crisis_end", "router"]:
    if state.get("crisis_detected"):
        return "crisis_end"
    return "router"


def after_router(state: PsyState) -> Literal["empathy", "lock", "test_handoff"]:
    intent = state.get("intent", "chat")
    if intent == "refuse_test":
        return "lock"
    if intent == "want_test":
        return "test_handoff"
    return "empathy"
