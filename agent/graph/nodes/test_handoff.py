from __future__ import annotations

from langchain_core.messages import AIMessage

from models.state import PsyState
from recommendation.engine import build_recommendation_plan


def _dedupe_keep_order(items: list[str]) -> list[str]:
    return list(dict.fromkeys(item for item in items if item))


def _format_depth(depth: str | None) -> str:
    if depth == "brief":
        return "偏快速筛查"
    if depth == "deep":
        return "偏完整评估"
    return "信息覆盖适中"


def _format_scale_line(scale: dict) -> str:
    question_count = scale.get("question_count")
    question_text = f"{question_count}题，" if question_count else ""
    reason = scale.get("reason") or "和你当前的诉求更贴近。"
    return f"- **{scale['title']}**：{question_text}{_format_depth(scale.get('assessment_depth'))}。{reason}"


def test_handoff_node(state: PsyState) -> dict:
    """Deterministic recommendation node for explicit scale requests."""
    last_msg = state["messages"][-1]
    user_text = last_msg.content if hasattr(last_msg, "content") else str(last_msg)

    plan = build_recommendation_plan(state, user_text, force_recommend=True)
    recommended = list(plan.get("recommended_scales", []))

    if recommended:
        scale_lines = "\n".join(_format_scale_line(scale) for scale in recommended)
        reply = (
            "可以，我先把更贴近你现在情况的量表排在前面：\n"
            f"{scale_lines}\n\n"
            "你可以直接点下面的“开始测评”进入答题。"
        )
        if plan.get("follow_up_question"):
            reply += f" 如果你愿意，我也想顺手确认一句：{plan['follow_up_question']}"
    else:
        reply = (
            "可以，我们也可以先从广谱筛查量表开始，帮你更快看清当前主要是压力、焦虑、低落，还是多方面交织。"
        )

    analysis = plan.get("analysis", {})
    extracted_symptoms = _dedupe_keep_order(list(state.get("extracted_symptoms", [])) + analysis.get("direct_signals", []))
    latent_needs = _dedupe_keep_order(list(state.get("latent_needs", [])) + analysis.get("latent_needs", []))

    return {
        "reply": reply,
        "messages": [AIMessage(content=reply)],
        "recommended_scales": recommended,
        "extracted_symptoms": extracted_symptoms,
        "latent_needs": latent_needs,
        "scale_scores": plan.get("scale_scores", {}),
        "rag_results": plan.get("ranked_candidates", []),
        "conversation_goal": "help the user enter the most relevant scale as quickly as possible",
        "follow_up_question": plan.get("follow_up_question", ""),
        "recommendation_cooldown": 2,
        "turn_count": state.get("turn_count", 0) + 1,
        "last_node": "test_handoff",
    }
