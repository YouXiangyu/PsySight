from __future__ import annotations

import re
from typing import Any

from recommendation.catalog import get_scale_catalog


EXPLICIT_REQUEST_PATTERNS = [
    r"我需要.*(量表|问卷|测试|评估)",
    r"(推荐|给我|想做|想测|需要|适合).*(量表|问卷|测试|评估)",
    r"(有|来).*(量表|问卷|测试|评估).*吗",
]

SHORT_PREFERENCE_PATTERNS = [
    "短一点",
    "简单一点",
    "快一点",
    "赶紧",
    "立刻",
    "马上",
]

DEEP_PREFERENCE_PATTERNS = [
    "详细",
    "全面",
    "深入",
    "准确一点",
    "更准确",
    "更系统",
]

CHRONIC_PATTERNS = ["长期", "一直", "总是", "经常", "反复", "好几个月", "几年", "老是"]
ACUTE_PATTERNS = ["最近", "这几天", "这两天", "突然", "刚刚", "这一阵", "近一周"]
URGENCY_PATTERNS = ["撑不住", "快崩溃", "受不了了", "特别严重", "影响很大", "很急", "救命"]

SIGNAL_KEYWORDS: dict[str, list[str]] = {
    "sleep": ["睡不好", "失眠", "睡不着", "睡眠", "入睡", "夜醒", "早醒", "多梦", "睡醒", "作息"],
    "insomnia": ["失眠", "睡不着", "入睡困难", "早醒", "夜里醒", "半夜醒"],
    "sleep_initiation": ["入睡困难", "睡不着", "很难睡着", "躺很久"],
    "night_waking": ["夜醒", "半夜醒", "睡到一半醒", "夜里总醒"],
    "early_waking": ["早醒", "醒太早"],
    "sleep_quality": ["睡得不好", "睡眠质量", "睡不踏实", "睡得不踏实", "睡不沉", "休息不好"],
    "sleep_duration": ["睡太少", "睡眠时间短", "只睡", "睡得很少"],
    "daytime_sleepiness": ["白天困", "白天犯困", "没精神", "犯困", "白天嗜睡", "白天撑不住"],
    "dream_disturbance": ["做梦", "噩梦", "梦多"],
    "anxiety": ["焦虑", "紧张", "担心", "不安", "害怕", "慌"],
    "worry": ["担心", "想太多", "停不下来", "脑子停不下来", "一直想"],
    "tension": ["紧张", "绷着", "放松不下来"],
    "restlessness": ["坐立不安", "烦躁", "静不下来"],
    "somatic_anxiety": ["心慌", "胸闷", "发抖", "头晕", "呼吸不过来", "出汗"],
    "panic_pattern": ["突然很慌", "像要死", "惊恐", "一阵一阵", "突然喘不过气"],
    "depression": ["抑郁", "低落", "提不起劲", "没动力", "情绪很差"],
    "low_mood": ["低落", "难过", "情绪差", "心情很差"],
    "anhedonia": ["没兴趣", "开心不起来", "什么都不想做", "提不起劲"],
    "hopelessness": ["绝望", "没有希望", "看不到希望"],
    "fatigue": ["疲惫", "很累", "乏力", "没精神"],
    "tearfulness": ["想哭", "容易哭", "哭"],
    "self_worth": ["没价值", "很差劲", "不配", "没用", "自卑"],
    "stress": ["压力", "压得喘不过气", "扛不住", "撑不住", "崩溃"],
    "burnout": ["耗尽", "倦怠", "被榨干", "burnout"],
    "general_distress": ["状态不好", "很难受", "乱糟糟", "撑不住", "什么都不对劲"],
    "trauma": ["创伤", "那件事之后", "事故之后", "经历之后", "阴影"],
    "intrusion": ["闪回", "反复想起", "画面会回来"],
    "avoidance": ["不敢想", "不敢去", "回避", "躲着"],
    "hypervigilance": ["警觉", "容易受惊", "绷着", "总觉得危险"],
    "nightmare": ["噩梦", "梦到那件事"],
    "attention": ["注意力", "分心", "专注不了", "总走神"],
    "executive_function": ["拖延", "做不完", "组织不了", "启动困难"],
    "forgetfulness": ["忘事", "记不住", "丢三落四"],
    "mania_activation": ["特别亢奋", "停不下来", "睡很少也不困", "话很多", "很上头"],
    "impulsivity": ["冲动消费", "冲动", "控制不住花钱"],
    "reduced_sleep_need": ["睡很少也不困", "不需要睡觉", "睡两三个小时也精神"],
    "mood_swings": ["情绪起伏大", "忽高忽低", "波动很大"],
    "compulsive": ["强迫", "反复检查", "洗很多遍", "仪式感动作"],
    "obsession": ["控制不住的念头", "脑子里反复想", "挥之不去"],
    "repetition": ["反复", "重复", "一遍又一遍"],
    "control_loss": ["控制不住", "停不下来"],
    "loneliness": ["孤独", "没人懂", "很孤单", "一个人"],
    "social_disconnection": ["被隔离", "没有连接感", "没有陪伴"],
    "social_anxiety": ["社恐", "社交焦虑", "不敢社交", "一见到人就紧张"],
    "interaction_fear": ["不敢说话", "怕跟人交流", "见人就紧张", "一见到人就紧张"],
    "evaluation_fear": ["怕被评价", "怕别人怎么看", "怕别人怎么看我", "担心别人怎么看我", "担心别人怎么想", "怕出丑"],
    "stranger_fear": ["怕见陌生人", "见陌生人很紧张"],
    "impostor": ["冒牌货", "配不上", "怕被发现", "都是运气"],
    "achievement_doubt": ["不配得", "不是真的厉害", "怕露馅"],
    "college_adjustment": ["学校", "大学", "宿舍", "课程", "考试周"],
}

LATENT_KEYWORDS: dict[str, list[str]] = {
    "sleep_control_loss": ["控制不住失眠", "越想睡越睡不着", "躺着很久"],
    "long_term_distress": ["一直这样", "很久了", "长期这样"],
    "daily_function_drop": ["影响上课", "影响工作", "白天撑不住", "状态掉很多"],
    "broad_sleep_impact": ["睡眠和白天都不好", "整个人都被睡眠拖垮"],
    "anticipatory_fear": ["还没发生就开始担心", "总往坏处想"],
    "mental_overload": ["脑子很满", "停不下来", "压得喘不过气"],
    "body_alarm": ["身体先反应", "胸口发紧", "身体很慌"],
    "self_worth_drop": ["觉得自己不行", "觉得自己很差", "不配"],
    "shutdown_state": ["什么都不想做", "像关机一样", "整个人沉下去"],
    "mixed_distress": ["什么问题都有", "说不上来但很难受", "很多方面都不对劲"],
    "multi_domain_distress": ["很多方面都出问题", "整个人都乱了"],
    "complex_case": ["说不清楚", "很多问题交织", "不是一个点"],
    "trauma_intrusion": ["老会想起那件事", "那画面会回来", "会被触发"],
    "attention_scatter": ["脑子散", "坐不住", "任务开了很多"],
    "activation_pattern": ["特别上头", "突然精力很旺", "停不下来"],
    "compulsive_pattern": ["明知道没必要还要做", "不做就不安心"],
    "social_avoidance": ["能躲就躲", "总想躲", "不敢去见人", "回避社交"],
    "social_emptiness": ["没人陪", "没有人可以说", "没有归属感"],
    "hidden_inadequacy": ["怕被发现", "像假的", "怕别人知道我其实不行"],
    "student_pressure": ["学业压力", "考试压力", "论文压力"],
}


def _contains_any(text: str, keywords: list[str]) -> bool:
    return any(keyword in text for keyword in keywords)


def _extract_matches(text: str, keyword_map: dict[str, list[str]]) -> list[str]:
    return [key for key, keywords in keyword_map.items() if _contains_any(text, keywords)]


DOMAIN_FALLBACK_SCORES: dict[str, dict[str, float]] = {
    "sleep": {"ais": 1.4, "psqi": 1.3},
    "anxiety": {"gad7": 1.4, "sas": 1.2},
    "depression": {"phq9": 1.4, "sds": 1.2, "bdi2": 1.1},
    "stress": {"dass21": 1.4, "k10": 1.2},
    "trauma": {"pcl5": 1.5, "iesr": 1.3},
    "attention": {"asrs": 1.5},
    "mood_activation": {"mdq": 1.5},
    "compulsive": {"ybocs": 1.5},
    "social_anxiety": {"sias": 1.4, "ias": 1.2},
    "interpersonal": {"ucla": 1.4},
    "self_worth": {"is": 1.4},
    "general_distress": {"k10": 1.4, "dass21": 1.2},
    "broad_screening": {"scl90": 1.4, "upi": 1.2},
}

GENERAL_FALLBACK_SCORES: dict[str, float] = {
    "k10": 3.8,
    "dass21": 3.5,
    "scl90": 3.0,
}

USER_FACING_REASON_BY_FOCUS: dict[str, str] = {
    "insomnia": "更贴近入睡困难、夜醒、早醒这类失眠表现。",
    "sleep_quality": "更适合看整体睡眠质量，以及白天是否也受到影响。",
    "general_anxiety": "更适合持续担心、紧张、停不下来的焦虑体验。",
    "somatic_anxiety": "更适合焦虑已经明显带到身体反应上的情况。",
    "depression_screening": "更适合先快速筛查低落、无力和兴趣下降。",
    "depression_depth": "更适合把低落、自责和动力下降看得更细一些。",
    "mixed_distress": "更适合压力、焦虑和低落交织在一起时先做区分。",
    "broad_screening": "更适合问题牵涉多个维度时先做一次广谱筛查。",
    "general_distress": "更适合先判断当前整体心理负荷有多重。",
    "ptsd": "更贴近创伤后的闯入、回避和警觉升高。",
    "trauma_impact": "更适合先看某件事件最近对你的影响有多大。",
    "adhd_screening": "更适合注意力分散、拖延和执行困难这类表现。",
    "bipolar_screening": "更适合排查精力异常上升、睡得少也不困这类状态。",
    "ocd": "更适合反复念头、反复检查或停不下来的仪式化行为。",
    "loneliness": "更适合孤独感和人际连接感不足是主轴的时候。",
    "social_interaction_anxiety": "更贴近见人就紧张、担心互动本身的社交焦虑。",
    "interpersonal_anxiety": "更适合普遍的人际紧张和见人不自在。",
    "impostor_syndrome": "更适合表面撑得住、内心却总怕自己不够好的状态。",
    "student_screening": "更适合学生场景下多方面压力交织时先筛查。",
}

SLEEP_SIGNAL_KEYS = {
    "sleep",
    "insomnia",
    "sleep_initiation",
    "night_waking",
    "early_waking",
    "sleep_quality",
    "sleep_duration",
    "daytime_sleepiness",
    "dream_disturbance",
}


def _has_domain(analysis: dict[str, Any], domain: str) -> bool:
    return domain in analysis.get("domains", [])


def _has_sleep_context(analysis: dict[str, Any]) -> bool:
    if _has_domain(analysis, "sleep"):
        return True
    return any(signal in SLEEP_SIGNAL_KEYS for signal in analysis.get("direct_signals", []))


def _seed_fallback_scores(analysis: dict[str, Any], turn_count: int) -> dict[str, float]:
    fallback: dict[str, float] = {}

    for domain in analysis.get("domains", []):
        for code, score in DOMAIN_FALLBACK_SCORES.get(domain, {}).items():
            fallback[code] = max(fallback.get(code, 0.0), score)

    if analysis.get("explicit_request") and not analysis.get("domains") and not analysis.get("direct_signals"):
        for code, score in GENERAL_FALLBACK_SCORES.items():
            fallback[code] = max(fallback.get(code, 0.0), score)
    elif turn_count >= 2 and not fallback:
        for code, score in GENERAL_FALLBACK_SCORES.items():
            fallback[code] = max(fallback.get(code, 0.0), score - 0.6)

    return fallback


def _build_user_facing_reason(scale: dict) -> str:
    clinical_focus = scale.get("clinical_focus")
    if clinical_focus in USER_FACING_REASON_BY_FOCUS:
        return USER_FACING_REASON_BY_FOCUS[clinical_focus]

    if scale.get("assessment_depth") == "brief":
        return "更适合先快速筛一下。"
    if scale.get("assessment_depth") == "deep":
        return "更适合做一次相对完整的评估。"
    return "和你刚才描述的重点更贴近。"


def analyze_message(user_text: str) -> dict[str, Any]:
    normalized = (user_text or "").strip().lower()
    catalog = get_scale_catalog()

    explicit_scale_codes = [
        scale["code"]
        for scale in catalog
        if any(alias and alias in normalized for alias in scale.get("aliases", []))
    ]
    explicit_request = any(re.search(pattern, normalized) for pattern in EXPLICIT_REQUEST_PATTERNS) or bool(explicit_scale_codes)
    direct_signals = _extract_matches(normalized, SIGNAL_KEYWORDS)
    latent_needs = _extract_matches(normalized, LATENT_KEYWORDS)

    urgency = "high" if _contains_any(normalized, URGENCY_PATTERNS) else "medium" if "影响" in normalized else "low"
    duration = "chronic" if _contains_any(normalized, CHRONIC_PATTERNS) else "acute" if _contains_any(normalized, ACUTE_PATTERNS) else "unknown"
    assessment_preference = "brief" if _contains_any(normalized, SHORT_PREFERENCE_PATTERNS) else "deep" if _contains_any(normalized, DEEP_PREFERENCE_PATTERNS) else "balanced"

    domains = sorted({
        domain
        for scale in catalog
        if scale["code"] in explicit_scale_codes
        for domain in scale.get("domains", [])
    })
    if not domains:
        domain_scores: dict[str, int] = {}
        for scale in catalog:
            overlap = len(set(scale.get("focus_tags", [])) & set(direct_signals))
            if overlap <= 0:
                continue
            for domain in scale.get("domains", []):
                domain_scores[domain] = domain_scores.get(domain, 0) + overlap

        if domain_scores:
            top_score = max(domain_scores.values())
            domains = [
                domain
                for domain, score in sorted(domain_scores.items(), key=lambda item: item[1], reverse=True)
                if score >= max(1, top_score - 1)
            ]

    if urgency == "high" and assessment_preference == "balanced":
        latent_needs.append("urgent_screening")
    if _has_sleep_context({"domains": domains, "direct_signals": direct_signals}) and duration == "chronic":
        latent_needs.append("chronic_sleep")
    if _has_sleep_context({"domains": domains, "direct_signals": direct_signals}) and duration == "acute":
        latent_needs.append("recent_poor_sleep")
    if assessment_preference == "brief":
        latent_needs.append("brief_screening")
    if assessment_preference == "deep":
        latent_needs.append("deep_assessment")
    if len(domains) >= 2 and "mixed_distress" not in latent_needs:
        latent_needs.append("mixed_distress")

    deduped_latent = list(dict.fromkeys(latent_needs))
    deduped_signals = list(dict.fromkeys(direct_signals))

    return {
        "explicit_request": explicit_request,
        "explicit_scale_codes": list(dict.fromkeys(explicit_scale_codes)),
        "direct_signals": deduped_signals,
        "latent_needs": deduped_latent,
        "urgency": urgency,
        "duration": duration,
        "assessment_preference": assessment_preference,
        "domains": domains,
    }


def _score_scale(scale: dict, analysis: dict[str, Any]) -> tuple[float, list[str]]:
    score = 0.0
    reasons: list[str] = []
    code = scale["code"]

    if code in analysis["explicit_scale_codes"]:
        score += 12.0
        reasons.append("explicitly requested by name")

    if analysis["explicit_request"] and any(domain in scale.get("domains", []) for domain in analysis["domains"]):
        score += 4.0
        reasons.append("matches the requested domain")
    elif any(domain in scale.get("domains", []) for domain in analysis["domains"]):
        score += 1.2
        reasons.append("matches the current topic")

    for signal in analysis["direct_signals"]:
        weight = float(scale.get("signal_weights", {}).get(signal, 0.0))
        if weight > 0:
            score += weight
            reasons.append(f"matched signal: {signal}")

    for need in analysis["latent_needs"]:
        weight = float(scale.get("latent_weights", {}).get(need, 0.0))
        if weight > 0:
            score += weight
            reasons.append(f"latent fit: {need}")
            continue

        contextual_weight = float(scale.get("signal_weights", {}).get(need, 0.0))
        if contextual_weight > 0:
            score += contextual_weight
            reasons.append(f"context fit: {need}")

    if analysis["assessment_preference"] == "brief":
        if scale.get("length_bucket") == "short":
            score += 1.6
            reasons.append("fits a shorter assessment preference")
        elif scale.get("length_bucket") == "long":
            score -= 0.8
    elif analysis["assessment_preference"] == "deep":
        if scale.get("assessment_depth") == "deep":
            score += 1.8
            reasons.append("fits a deeper assessment preference")
        elif scale.get("assessment_depth") == "brief":
            score -= 0.6

    if analysis["urgency"] == "high" and scale.get("length_bucket") == "short":
        score += 1.2
        reasons.append("works better for urgent triage")

    if analysis["duration"] == "chronic" and scale.get("clinical_focus") in {"insomnia", "depression_depth"}:
        score += 0.8
    if analysis["duration"] == "acute" and scale.get("clinical_focus") in {"sleep_quality", "general_distress"}:
        score += 0.6

    return score, reasons


def _merge_scores(previous_scores: dict[str, float], current_scores: dict[str, float]) -> dict[str, float]:
    merged: dict[str, float] = {}
    for code, score in previous_scores.items():
        merged[code] = round(float(score) * 0.82, 3)
    for code, score in current_scores.items():
        merged[code] = round(merged.get(code, 0.0) + score, 3)
    return merged


def _recommendation_threshold(turn_count: int, explicit_request: bool) -> float:
    if explicit_request:
        return 4.8
    if turn_count >= 2:
        return 5.5
    if turn_count >= 1:
        return 6.2
    return 7.2


def _build_goal(analysis: dict[str, Any], top_candidate: dict | None) -> str:
    if analysis["explicit_request"]:
        return "help the user enter the most relevant scale as quickly as possible"
    if top_candidate and top_candidate.get("clinical_focus") == "insomnia":
        return "clarify whether the sleep issue is chronic insomnia or broader sleep-quality decline"
    if top_candidate and top_candidate.get("domains"):
        return f"gently narrow the conversation toward the user's main {top_candidate['domains'][0]} need"
    return "move the conversation toward one clearer assessment direction"


def _build_follow_up_question(analysis: dict[str, Any], ranked: list[dict], should_recommend: bool) -> str:
    if ranked:
        top = ranked[0]
        if top.get("clarifying_question") and (not should_recommend or len(ranked) > 1 and abs(ranked[0]["fit_score"] - ranked[1]["fit_score"]) < 1.2):
            return top["clarifying_question"]

    if "sleep" in analysis["domains"] or "sleep" in analysis["direct_signals"]:
        return "这类睡眠困扰更像长期入睡/早醒问题，还是最近整体睡眠质量下降、白天也受影响？"
    if "anxiety" in analysis["domains"]:
        return "这种不安更像持续停不下来的担心，还是会突然冲上来的惊慌和身体反应？"
    if "depression" in analysis["domains"]:
        return "这种状态更偏向持续低落和无力，还是最近明显失去兴趣、什么都提不起劲？"
    if "stress" in analysis["domains"]:
        return "最压垮你的更像长期高压本身，还是它已经开始明显影响睡眠、情绪和效率了？"
    return "如果把这件事说得更具体一点，此刻最困扰你的那个细节会是什么？"


def build_recommendation_plan(state: dict[str, Any], user_text: str, *, force_recommend: bool = False) -> dict[str, Any]:
    catalog = get_scale_catalog()
    analysis = analyze_message(user_text)
    previous_scores = state.get("scale_scores", {}) or {}
    turn_count = int(state.get("turn_count", 0))

    current_scores: dict[str, float] = {}
    explanations: dict[str, list[str]] = {}
    for scale in catalog:
        delta, reasons = _score_scale(scale, analysis)
        if delta > 0:
            current_scores[scale["code"]] = round(delta, 3)
            explanations[scale["code"]] = reasons

    for code, seed_score in _seed_fallback_scores(analysis, turn_count).items():
        current_scores[code] = round(max(current_scores.get(code, 0.0), seed_score), 3)
        explanations.setdefault(code, []).append("fallback candidate to keep the conversation moving")

    merged_scores = _merge_scores(previous_scores, current_scores)
    ranked = sorted(
        [
            {
                **scale,
                "fit_score": merged_scores.get(scale["code"], 0.0),
                "reasons": explanations.get(scale["code"], []),
            }
            for scale in catalog
            if merged_scores.get(scale["code"], 0.0) > 0
        ],
        key=lambda item: item["fit_score"],
        reverse=True,
    )

    threshold = _recommendation_threshold(turn_count, analysis["explicit_request"])
    top_score = ranked[0]["fit_score"] if ranked else 0.0
    should_recommend = force_recommend or bool(ranked and top_score >= threshold)

    recommended = []
    if ranked and should_recommend:
        floor = max(threshold - 1.5, top_score - 2.4)
        recommended = [
            {
                "code": item["code"],
                "title": item["title"],
                "scale_id": item.get("scale_id"),
                "fit_score": item["fit_score"],
                "question_count": item.get("question_count"),
                "assessment_depth": item.get("assessment_depth"),
                "question_style": item.get("question_style"),
                "clinical_focus": item.get("clinical_focus"),
                "reason": _build_user_facing_reason(item),
            }
            for item in ranked[:3]
            if item["fit_score"] >= floor
        ]

    top_candidate = ranked[0] if ranked else None
    follow_up_question = _build_follow_up_question(analysis, ranked, should_recommend)

    return {
        "analysis": analysis,
        "score_threshold": threshold,
        "scale_scores": merged_scores,
        "ranked_candidates": ranked[:5],
        "recommended_scales": recommended,
        "should_recommend": should_recommend,
        "follow_up_question": follow_up_question,
        "conversation_goal": _build_goal(analysis, top_candidate),
    }


def build_strategy_context(plan: dict[str, Any]) -> str:
    analysis = plan.get("analysis", {})
    ranked = plan.get("ranked_candidates", [])
    recommended = plan.get("recommended_scales", [])

    candidate_lines = [
        f"- {item['title']} ({item['code']}): score={item['fit_score']}, focus={item.get('clinical_focus')}, depth={item.get('assessment_depth')}"
        for item in ranked[:3]
    ]
    recommendation_lines = [
        f"- {item['title']} ({item['code']}): {item.get('reason') or 'strong fit'}"
        for item in recommended
    ]

    return "\n".join([
        "## Conversation strategy",
        f"- Current goal: {plan.get('conversation_goal', 'clarify the next best assessment direction')}",
        f"- Recommend now: {'yes' if plan.get('should_recommend') else 'no'}",
        f"- Direct signals: {', '.join(analysis.get('direct_signals', [])) or 'none yet'}",
        f"- Latent needs: {', '.join(analysis.get('latent_needs', [])) or 'none yet'}",
        f"- Follow-up question to anchor the next turn: {plan.get('follow_up_question', '')}",
        "## Top candidates",
        *(candidate_lines or ["- No strong candidate yet"]),
        "## If you recommend scales in the reply, prefer these",
        *(recommendation_lines or ["- Do not recommend a scale yet"]),
        "## Reply style rules",
        "- Reply in the user's language.",
        "- Avoid generic reassurance and empty empathy.",
        "- Be purposeful: mention one concrete observation, one small next step, and end with the targeted follow-up question.",
    ])
