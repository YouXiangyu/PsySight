from __future__ import annotations

import json
import logging

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from llm.client import get_llm
from llm.prompts import build_empathy_prompt, build_fallback_reply
from models.profile import UserProfile
from models.state import PsyState
from recommendation.engine import build_recommendation_plan, build_strategy_context

logger = logging.getLogger(__name__)


def _dedupe_keep_order(items: list[str]) -> list[str]:
    return list(dict.fromkeys(item for item in items if item))


def _ensure_scale_guidance(reply: str, recommended_scales: list[dict]) -> str:
    if not recommended_scales:
        return reply

    top = recommended_scales[0]
    if top.get("title") and top["title"] in reply:
        return reply

    question_count = top.get("question_count")
    depth = top.get("assessment_depth")
    reason = top.get("reason") or "它和你刚才描述的重点更贴近。"

    pieces = [f"如果你愿意，我会优先建议你先做 {top['title']}。"]
    if question_count:
        pieces.append(f"它大约有 {question_count} 题")
    if depth == "brief":
        pieces.append("更适合先快速筛一下")
    elif depth == "deep":
        pieces.append("更适合做一次相对完整的评估")
    pieces.append(reason)

    guidance = "，".join(piece.rstrip("。") for piece in pieces[:-1]) + "。" + pieces[-1]
    return f"{reply.rstrip()}\n\n{guidance}"


def _ensure_follow_up_question(reply: str, question: str) -> str:
    if not question or question in reply:
        return reply
    return f"{reply.rstrip()}\n\n{question}"


async def empathy_node(state: PsyState) -> dict:
    """Strategy-driven empathy node with cumulative recommendation scoring."""
    last_msg = state["messages"][-1]
    user_text = last_msg.content if hasattr(last_msg, "content") else str(last_msg)

    profile_data = state.get("user_profile", {})
    profile = UserProfile.from_api_response(profile_data) if profile_data else UserProfile()
    profile_context = profile.to_prompt_context()

    plan = build_recommendation_plan(state, user_text)
    strategy_context = build_strategy_context(plan)

    system_prompt = build_empathy_prompt(profile_context, strategy_context)
    llm = get_llm(use_thinking=state.get("use_thinking", False))

    reply = ""
    raw = ""

    try:
        response = await llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_text),
        ])
        raw = (response.content or "").strip()

        if raw.startswith("```"):
            raw = raw.split("```", 1)[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.rstrip("`").strip()

        parsed = json.loads(raw)
        reply = (parsed.get("reply") or "").strip()
    except json.JSONDecodeError:
        logger.warning("Empathy reply was not valid JSON, falling back: %s", raw[:200])
    except Exception as exc:
        logger.error("Empathy node LLM call failed, using fallback reply: %s", exc)

    if not reply:
        reply = build_fallback_reply(user_text)

    cooldown = max(int(state.get("recommendation_cooldown", 0) or 0) - 1, 0)
    recommended_scales = list(plan.get("recommended_scales", []))

    if state.get("scale_locked"):
        recommended_scales = []
    elif cooldown > 0:
        recommended_scales = []
    elif recommended_scales:
        cooldown = 2

    if recommended_scales:
        reply = _ensure_scale_guidance(reply, recommended_scales)

    reply = _ensure_follow_up_question(reply, plan.get("follow_up_question", ""))

    analysis = plan.get("analysis", {})
    existing_symptoms = list(state.get("extracted_symptoms", []))
    existing_latent = list(state.get("latent_needs", []))

    extracted_symptoms = _dedupe_keep_order(existing_symptoms + analysis.get("direct_signals", []))
    latent_needs = _dedupe_keep_order(existing_latent + analysis.get("latent_needs", []))

    return {
        "reply": reply,
        "messages": [AIMessage(content=reply)],
        "extracted_symptoms": extracted_symptoms,
        "latent_needs": latent_needs,
        "scale_scores": plan.get("scale_scores", {}),
        "rag_results": plan.get("ranked_candidates", []),
        "recommended_scales": recommended_scales,
        "conversation_goal": plan.get("conversation_goal", ""),
        "follow_up_question": plan.get("follow_up_question", ""),
        "recommendation_cooldown": cooldown,
        "turn_count": state.get("turn_count", 0) + 1,
        "last_node": "empathy",
    }
