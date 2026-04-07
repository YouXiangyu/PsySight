from __future__ import annotations

import json
import logging

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

logger = logging.getLogger(__name__)

from llm.client import get_llm
from llm.prompts import build_empathy_prompt, build_fallback_reply
from models.profile import UserProfile
from models.state import PsyState
from retrieval.scale_index import get_scale_index_search
from retrieval.scale_rag import get_scale_rag


def _should_recommend(state: PsyState) -> bool:
    if state.get("scale_locked"):
        return False
    symptoms = state.get("extracted_symptoms", [])
    return len(symptoms) >= 1


def _run_retrieval(state: PsyState, symptoms: list[str]) -> list[dict]:
    query = " ".join(symptoms)
    if state.get("search_mode") == "rag":
        try:
            rag = get_scale_rag()
            return rag.search(query, top_k=3)
        except Exception:
            pass

    index_search = get_scale_index_search()
    return index_search.search(symptoms, top_k=3)


async def empathy_node(state: PsyState) -> dict:
    """Core empathy + symptom extraction + optional scale recommendation."""
    last_msg = state["messages"][-1]
    user_text = last_msg.content if hasattr(last_msg, "content") else str(last_msg)

    profile_data = state.get("user_profile", {})
    profile = UserProfile.from_api_response(profile_data) if profile_data else UserProfile()
    profile_context = profile.to_prompt_context()

    existing_symptoms = list(state.get("extracted_symptoms", []))
    check_recommend = _should_recommend(state)

    scale_context = ""
    rag_results: list[dict] = []
    if check_recommend and existing_symptoms:
        rag_results = _run_retrieval(state, existing_symptoms)
        if rag_results:
            scale_lines = [f"- {s['title']} (code: {s['code']})" for s in rag_results[:3]]
            scale_context = (
                "## 可推荐的量表（仅在合适时自然提及，不要强推）\n"
                + "\n".join(scale_lines)
                + "\n如果你认为用户状态适合做测试，请温和地询问是否愿意做一个小测评。"
            )

    system_prompt = build_empathy_prompt(profile_context, scale_context)
    llm = get_llm(use_thinking=state.get("use_thinking", False))

    raw = ""
    reply = ""
    new_symptoms: list[str] = []
    should_rec = False
    rec_codes: list[str] = []

    try:
        response = await llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_text),
        ])
        raw = (response.content or "").strip()

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.rstrip("`").strip()

        parsed = json.loads(raw)
        reply = parsed.get("reply", "")
        new_symptoms = parsed.get("extracted_symptoms", [])
        should_rec = parsed.get("should_recommend", False)
        rec_codes = parsed.get("recommended_scale_codes", [])
    except json.JSONDecodeError:
        logger.warning("LLM 返回非 JSON，使用原文兜底: %s", raw[:200])
        reply = raw if raw and not raw.strip().startswith("{") else build_fallback_reply(user_text)
        new_symptoms = []
        should_rec = False
        rec_codes = []
    except Exception as exc:
        logger.error("LLM 调用失败，走兜底回复: %s", exc)
        reply = build_fallback_reply(user_text)
        new_symptoms = []
        should_rec = False
        rec_codes = []

    if not reply:
        reply = build_fallback_reply(user_text)

    all_symptoms = list(set(existing_symptoms + new_symptoms))

    recommended_scales: list[dict] = []

    if should_rec and rec_codes and not state.get("scale_locked"):
        for code in rec_codes[:3]:
            matched = next((s for s in rag_results if s["code"] == code), None)
            if matched:
                recommended_scales.append({
                    "code": matched["code"],
                    "title": matched["title"],
                    "scale_id": matched.get("scale_id"),
                })

    return {
        "reply": reply,
        "messages": [AIMessage(content=reply)],
        "extracted_symptoms": all_symptoms,
        "rag_results": rag_results,
        "recommended_scales": recommended_scales,
        "turn_count": state.get("turn_count", 0) + 1,
        "last_node": "empathy",
    }
