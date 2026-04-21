
from __future__ import annotations

try:
    from recommendation.planner_v2 import extract_evidence
    from models.state import PsyState
except ModuleNotFoundError:
    from agent.recommendation.planner_v2 import extract_evidence
    from agent.models.state import PsyState


def evidence_extractor_node(state: PsyState) -> dict:
    last_msg = state["messages"][-1]
    user_text = last_msg.content if hasattr(last_msg, "content") else str(last_msg)
    evidence = extract_evidence(user_text, state)
    return {
        "evidence": evidence,
        "uncertainty_slots": evidence.get("uncertainty_slots", []),
        "last_node": "evidence_extractor",
    }
