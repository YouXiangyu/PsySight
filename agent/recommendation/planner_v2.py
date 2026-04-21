
from __future__ import annotations

try:
    from recommendation.scale_policy import analyze_message_v2, get_adaptive_scale_catalog
except ModuleNotFoundError:
    from agent.recommendation.scale_policy import analyze_message_v2, get_adaptive_scale_catalog

DECAY = 0.82

def extract_evidence(user_text: str, state: dict) -> dict:
    evidence = analyze_message_v2(user_text)
    # enrich a few hidden intents with rule-level inferences
    direct = set(evidence["direct_signals"])
    latent = set(evidence["latent_needs"])

    if {"sleep_quality", "daytime_sleepiness"} & direct:
        latent.add("broad_sleep_decline")
        latent.add("quality_decline")
    if {"sleep_initiation", "night_waking", "early_waking"} & direct:
        latent.add("chronic_insomnia" if evidence["duration"] == "chronic" else "insomnia_like")
    if "worry" in direct:
        latent.add("general_worry")
    if {"somatic_anxiety", "panic_pattern"} & direct:
        latent.add("somatic_anxiety_dominant")
    if {"social_anxiety", "interaction_fear", "evaluation_fear"} & direct:
        latent.add("social_interaction_anxiety")
    if "loneliness" in direct or "social_disconnection" in direct:
        latent.add("loneliness_core")
    if {"impostor", "achievement_doubt"} & direct:
        latent.add("impostor_syndrome")
    if {"attention", "executive_function", "forgetfulness"} & direct:
        latent.add("adhd_pattern")
    if {"trauma", "intrusion", "avoidance", "hypervigilance"} & direct:
        latent.add("ptsd_pattern")
    if "general_distress" in direct or "mixed_distress" in latent:
        latent.add("general_distress")
    if evidence["urgency"] == "high" and len(evidence["domains"]) >= 2:
        latent.add("broad_but_urgent")
    if "stress" in direct or "burnout" in direct:
        latent.add("stress_heavy")
    evidence["latent_needs"] = list(dict.fromkeys(latent))
    return evidence

def _base_score(scale: dict, evidence: dict) -> float:
    score = 0.0
    direct = set(evidence["direct_signals"])
    latent = set(evidence["latent_needs"])
    domains = set(evidence["domains"])

    if evidence["explicit_request"] and (domains & set(scale["domains"]) or scale["code"] in scale["title"].lower()):
        score += 3.2

    overlap_direct = len(direct & set(scale["surface_tags"]))
    score += overlap_direct * 1.1

    overlap_latent = len(latent & set(scale["latent_tags"]))
    score += overlap_latent * 0.9

    if domains & set(scale["domains"]):
        score += 1.3

    for tag, w in scale.get("discriminators", {}).items():
        if tag in latent or tag in direct:
            score += float(w)

    for tag in scale.get("preferred_when", []):
        if tag in latent:
            score += 1.0

    for tag in scale.get("avoid_when", []):
        if tag in latent:
            score -= 1.0

    if evidence["preference_depth"] == "brief":
        if scale["burden_level"] == "low":
            score += 1.1
        elif scale["burden_level"] == "high":
            score -= 0.8
    elif evidence["preference_depth"] == "deep":
        if scale["assessment_depth"] in ("deep", "balanced"):
            score += 0.9
        if scale["burden_level"] == "low":
            score -= 0.2

    if evidence["urgency"] == "high" and scale["burden_level"] == "low":
        score += 0.8
    if evidence["duration"] == "chronic" and scale["clinical_focus"] in ("insomnia", "ptsd"):
        score += 0.6

    # broad fallback
    if not direct and not latent and scale["code"] in ("k10", "dass21"):
        score += 1.0

    return round(score, 3)

def _merge_scores(prev: dict[str, float], curr: dict[str, float]) -> dict[str, float]:
    merged = {}
    for code, s in (prev or {}).items():
        merged[code] = round(float(s) * DECAY, 3)
    for code, s in curr.items():
        merged[code] = round(merged.get(code, 0.0) + s, 3)
    return merged

def _rank_scales(evidence: dict, prev_scores: dict[str, float]) -> list[dict]:
    catalog = get_adaptive_scale_catalog()
    current_scores = {}
    for scale in catalog:
        s = _base_score(scale, evidence)
        if s > 0:
            current_scores[scale["code"]] = s
    merged = _merge_scores(prev_scores, current_scores)
    ranked = []
    for scale in catalog:
        score = merged.get(scale["code"], 0.0)
        if score <= 0:
            continue
        ranked.append({**scale, "fit_score": score})
    ranked.sort(key=lambda x: x["fit_score"], reverse=True)
    return ranked

def _clarify_question(evidence: dict, ranked: list[dict]) -> str:
    slots = evidence.get("uncertainty_slots", [])
    if "insomnia_vs_broad_sleep_decline" in slots:
        return "你更困扰的是长期入睡困难/夜醒/早醒，还是最近整体睡眠质量下降、白天也没精神？"
    if "worry_vs_somatic_anxiety" in slots:
        return "这种焦虑更像脑子停不下来的担心，还是会伴随明显心慌、手抖、呼吸紧？"
    if "social_avoidance_vs_loneliness" in slots:
        return "现在更核心的是见人会紧张回避，还是那种没人理解、很孤单的感觉？"
    if ranked and ranked[0].get("clarifying_question"):
        return ranked[0]["clarifying_question"]
    return "如果只抓一个最困扰你的点，它更接近哪一种表现？"

def _goal(evidence: dict, ranked: list[dict], policy_action: str) -> str:
    if policy_action == "direct_recommend":
        return "help the user enter the most relevant scale quickly"
    if policy_action == "strategic_clarify":
        return "reduce uncertainty between the top candidate scales"
    if "sleep" in evidence["domains"]:
        return "clarify whether the sleep issue is chronic insomnia or broader sleep-quality decline"
    if "social_anxiety" in evidence["domains"]:
        return "clarify whether the core issue is social interaction anxiety or interpersonal disconnection"
    return "move the conversation toward one clearer assessment direction"

def build_adaptive_recommendation_plan(state: dict, user_text: str, *, force_recommend: bool = False) -> dict:
    evidence = extract_evidence(user_text, state)
    prev_scores = state.get("scale_scores", {}) or {}
    turn_count = int(state.get("turn_count", 0))
    ranked = _rank_scales(evidence, prev_scores)
    top = ranked[0]["fit_score"] if ranked else 0.0

    if force_recommend or evidence["explicit_request"]:
        threshold = 4.8
    elif turn_count >= 2:
        threshold = 5.8
    elif turn_count >= 1:
        threshold = 5.9
    else:
        threshold = 7.1

    should_recommend = bool(ranked and top >= threshold)
    policy_action = "empathy"
    if force_recommend or evidence["explicit_request"] and ranked:
        policy_action = "direct_recommend"
        should_recommend = True
    elif should_recommend:
        policy_action = "direct_recommend"
    elif ranked and top >= max(4.6, threshold - 1.6):
        policy_action = "strategic_clarify"

    recommended = []
    if ranked and (should_recommend or policy_action == "direct_recommend"):
        floor = max(top - 1.2, threshold - 0.5)
        for item in ranked[:3]:
            if item["fit_score"] >= floor:
                recommended.append({
                    "code": item["code"],
                    "title": item["title"],
                    "fit_score": item["fit_score"],
                    "question_count": item["question_count"],
                    "assessment_depth": item["assessment_depth"],
                    "burden_level": item["burden_level"],
                    "clinical_focus": item["clinical_focus"],
                    "reason": _reason(item),
                })

    merged_scores = {item["code"]: item["fit_score"] for item in ranked}
    follow_up_question = _clarify_question(evidence, ranked)
    goal = _goal(evidence, ranked, policy_action)

    return {
        "evidence": evidence,
        "ranked_candidates": ranked[:5],
        "recommended_scales": recommended,
        "scale_scores": merged_scores,
        "policy_action": policy_action,
        "score_threshold": threshold,
        "should_recommend": should_recommend,
        "follow_up_question": follow_up_question,
        "conversation_goal": goal,
        "uncertainty_slots": evidence.get("uncertainty_slots", []),
    }

def _reason(item: dict) -> str:
    focus = item.get("clinical_focus")
    if focus == "insomnia":
        return "更适合长期入睡困难、夜醒、早醒这类失眠样表现。"
    if focus == "sleep_quality":
        return "更适合整体睡眠质量下降、白天状态也受影响的情况。"
    if focus == "general_anxiety":
        return "更适合持续担心、紧张、停不下来的焦虑体验。"
    if focus == "somatic_anxiety":
        return "更适合焦虑已经明显带到身体反应上的情况。"
    if focus == "mixed_distress":
        return "更适合压力、焦虑、低落交织在一起时先做区分。"
    if focus == "broad_screening":
        return "更适合问题涉及多个维度、想先做较完整筛查时使用。"
    if focus == "social_interaction_anxiety":
        return "更贴近见人就紧张、互动本身就有压力的社交焦虑。"
    if focus == "loneliness":
        return "更贴近孤独感、缺少连接感是主轴的时候。"
    return "和你当前描述的重点更贴近。"
