
from __future__ import annotations

try:
    from recommendation.planner_v2 import build_adaptive_recommendation_plan
    from models.state import PsyState
except ModuleNotFoundError:
    from agent.recommendation.planner_v2 import build_adaptive_recommendation_plan
    from agent.models.state import PsyState


def recommendation_planner_node(state: PsyState) -> dict:
    last_msg = state["messages"][-1]
    user_text = last_msg.content if hasattr(last_msg, "content") else str(last_msg)
    plan = build_adaptive_recommendation_plan(state, user_text)
    return {
        "evidence": plan["evidence"],
        "policy_action": plan["policy_action"],
        "recommended_scales": plan["recommended_scales"],
        "scale_scores": plan["scale_scores"],
        "conversation_goal": plan["conversation_goal"],
        "follow_up_question": plan["follow_up_question"],
        "uncertainty_slots": plan["uncertainty_slots"],
        "candidate_scores_log": plan["ranked_candidates"],
        "last_node": "recommendation_planner",
    }
