
from __future__ import annotations

from langchain_core.messages import AIMessage

try:
    from recommendation.planner_v2 import build_adaptive_recommendation_plan
    from models.state import PsyState
except ModuleNotFoundError:
    from agent.recommendation.planner_v2 import build_adaptive_recommendation_plan
    from agent.models.state import PsyState


def direct_recommend_node(state: PsyState) -> dict:
    last_msg = state["messages"][-1]
    user_text = last_msg.content if hasattr(last_msg, "content") else str(last_msg)
    plan = build_adaptive_recommendation_plan(state, user_text, force_recommend=True)
    recs = plan.get("recommended_scales", [])
    if recs:
        lines = []
        for item in recs[:2]:
            lines.append(
                f"- **{item['title']}**：约 {item.get('question_count', '?')} 题，"
                f"{item.get('assessment_depth', 'balanced')}，{item.get('reason', '更贴近当前诉求。')}"
            )
        reply = (
            "可以，我先把更贴近你当前情况的量表排在前面：\n"
            + "\n".join(lines)
            + "\n\n如果你愿意，我建议先从排在最前面的那个开始。"
        )
    else:
        reply = "可以，我建议先从一个广谱筛查量表开始，先帮你快速确定当前主要困扰在哪个方向。"

    return {
        "reply": reply,
        "messages": [AIMessage(content=reply)],
        "recommended_scales": recs,
        "scale_scores": plan["scale_scores"],
        "conversation_goal": plan["conversation_goal"],
        "follow_up_question": plan["follow_up_question"],
        "turn_count": state.get("turn_count", 0) + 1,
        "last_node": "direct_recommend",
    }
