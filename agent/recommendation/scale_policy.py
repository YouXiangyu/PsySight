
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
import re

_INDEX_PATH = Path(__file__).resolve().parent.parent / "retrieval" / "scale_index_data.json"

QUESTION_COUNTS = {
    "ais": 8,
    "psqi": 19,
    "gad7": 7,
    "sas": 20,
    "phq9": 9,
    "dass21": 21,
    "scl90": 90,
    "k10": 10,
    "sias": 20,
    "ias": 15,
    "ucla": 20,
    "is": 20,
    "asrs": 18,
    "mdq": 15,
    "ybocs": 10,
    "pcl5": 20,
    "upi": 60,
}

POLICY_OVERRIDES = {
    "ais": {
        "domains": ["sleep"],
        "surface_tags": ["sleep", "insomnia", "sleep_initiation", "night_waking", "early_waking"],
        "latent_tags": ["long_term_distress", "brief_screening"],
        "preferred_when": ["chronic_insomnia", "sleep_initiation", "night_waking", "early_waking"],
        "avoid_when": ["broad_sleep_decline_only"],
        "burden_level": "low",
        "urgency_bias": "high",
        "assessment_depth": "brief",
        "clinical_focus": "insomnia",
        "discriminators": {"chronic_insomnia": 2.0, "sleep_initiation": 1.8, "night_waking": 1.3, "early_waking": 1.3},
        "clarifying_question": "这种困扰更像长期入睡困难、夜里总醒或早醒吗？",
    },
    "psqi": {
        "domains": ["sleep"],
        "surface_tags": ["sleep", "sleep_quality", "sleep_duration", "daytime_sleepiness", "dream_disturbance"],
        "latent_tags": ["daily_function_drop", "deep_assessment"],
        "preferred_when": ["broad_sleep_decline", "daytime_sleepiness", "quality_decline"],
        "avoid_when": [],
        "burden_level": "medium",
        "urgency_bias": "medium",
        "assessment_depth": "deep",
        "clinical_focus": "sleep_quality",
        "discriminators": {"broad_sleep_decline": 1.8, "daytime_sleepiness": 1.4, "quality_decline": 1.8},
        "clarifying_question": "你更困扰的是最近整体睡眠质量下降、白天也受影响，还是典型的长期失眠样问题？",
    },
    "gad7": {
        "domains": ["anxiety"],
        "surface_tags": ["anxiety", "worry", "tension", "restlessness"],
        "latent_tags": ["brief_screening", "anticipatory_fear"],
        "preferred_when": ["general_worry"],
        "avoid_when": ["somatic_anxiety_dominant"],
        "burden_level": "low",
        "urgency_bias": "high",
        "assessment_depth": "brief",
        "clinical_focus": "general_anxiety",
        "discriminators": {"general_worry": 1.8},
        "clarifying_question": "这种不安更像持续停不下来的担心吗？",
    },
    "sas": {
        "domains": ["anxiety"],
        "surface_tags": ["anxiety", "somatic_anxiety", "panic_pattern"],
        "latent_tags": ["body_alarm", "deep_assessment"],
        "preferred_when": ["somatic_anxiety_dominant", "panic_like"],
        "avoid_when": [],
        "burden_level": "medium",
        "urgency_bias": "medium",
        "assessment_depth": "balanced",
        "clinical_focus": "somatic_anxiety",
        "discriminators": {"somatic_anxiety_dominant": 1.8, "panic_like": 1.2},
        "clarifying_question": "这种焦虑有明显的心慌、呼吸紧、手抖之类身体反应吗？",
    },
    "phq9": {
        "domains": ["depression"],
        "surface_tags": ["depression", "low_mood", "anhedonia", "fatigue"],
        "latent_tags": ["brief_screening", "self_worth_drop"],
        "preferred_when": ["depression_screening"],
        "avoid_when": [],
        "burden_level": "low",
        "urgency_bias": "high",
        "assessment_depth": "brief",
        "clinical_focus": "depression_screening",
        "discriminators": {"depression_screening": 1.5},
        "clarifying_question": "这种状态更偏向持续低落和无力，还是最近明显什么都提不起劲？",
    },
    "dass21": {
        "domains": ["general_distress", "anxiety", "depression", "stress"],
        "surface_tags": ["stress", "anxiety", "depression", "burnout", "general_distress"],
        "latent_tags": ["mixed_distress"],
        "preferred_when": ["mixed_distress", "stress_heavy"],
        "avoid_when": [],
        "burden_level": "medium",
        "urgency_bias": "medium",
        "assessment_depth": "balanced",
        "clinical_focus": "mixed_distress",
        "discriminators": {"mixed_distress": 1.6, "stress_heavy": 1.3},
        "clarifying_question": "你更想先区分压力、焦虑和低落里哪一块最重吗？",
    },
    "k10": {
        "domains": ["general_distress"],
        "surface_tags": ["general_distress", "stress", "anxiety", "depression"],
        "latent_tags": ["brief_screening"],
        "preferred_when": ["broad_but_urgent", "general_distress"],
        "avoid_when": [],
        "burden_level": "low",
        "urgency_bias": "high",
        "assessment_depth": "brief",
        "clinical_focus": "general_distress",
        "discriminators": {"broad_but_urgent": 1.4, "general_distress": 1.2},
        "clarifying_question": "如果先做一个快速筛查，你更希望尽快判断整体心理负荷吗？",
    },
    "scl90": {
        "domains": ["broad_screening"],
        "surface_tags": ["general_distress", "mixed_distress", "interpersonal", "compulsive"],
        "latent_tags": ["complex_case", "deep_assessment"],
        "preferred_when": ["complex_case", "multi_domain_distress"],
        "avoid_when": ["brief_screening"],
        "burden_level": "high",
        "urgency_bias": "low",
        "assessment_depth": "deep",
        "clinical_focus": "broad_screening",
        "discriminators": {"complex_case": 1.8, "multi_domain_distress": 1.6},
        "clarifying_question": "你的困扰是不是已经涉及很多方面，想做一次比较完整的广谱筛查？",
    },
    "sias": {
        "domains": ["social_anxiety"],
        "surface_tags": ["social_anxiety", "interaction_fear", "evaluation_fear"],
        "latent_tags": ["social_avoidance"],
        "preferred_when": ["social_interaction_anxiety"],
        "avoid_when": [],
        "burden_level": "medium",
        "urgency_bias": "medium",
        "assessment_depth": "balanced",
        "clinical_focus": "social_interaction_anxiety",
        "discriminators": {"social_interaction_anxiety": 1.9, "social_avoidance": 1.4},
        "clarifying_question": "你更紧张的是和人互动本身，还是更怕被评价、被盯着看？",
    },
    "ias": {
        "domains": ["social_anxiety"],
        "surface_tags": ["social_anxiety", "stranger_fear", "interaction_fear"],
        "latent_tags": ["social_avoidance"],
        "preferred_when": ["interpersonal_anxiety"],
        "avoid_when": [],
        "burden_level": "low",
        "urgency_bias": "medium",
        "assessment_depth": "brief",
        "clinical_focus": "interpersonal_anxiety",
        "discriminators": {"interpersonal_anxiety": 1.5},
        "clarifying_question": "你会更怕见陌生人或置身社交场合吗？",
    },
    "ucla": {
        "domains": ["interpersonal"],
        "surface_tags": ["loneliness", "social_disconnection"],
        "latent_tags": ["social_emptiness"],
        "preferred_when": ["loneliness_core"],
        "avoid_when": [],
        "burden_level": "medium",
        "urgency_bias": "medium",
        "assessment_depth": "balanced",
        "clinical_focus": "loneliness",
        "discriminators": {"loneliness_core": 1.8},
        "clarifying_question": "现在更核心的是孤独感和没人连接，还是见人会紧张回避？",
    },
    "is": {
        "domains": ["self_worth"],
        "surface_tags": ["impostor", "self_worth", "achievement_doubt"],
        "latent_tags": ["hidden_inadequacy"],
        "preferred_when": ["impostor_syndrome"],
        "avoid_when": [],
        "burden_level": "medium",
        "urgency_bias": "low",
        "assessment_depth": "balanced",
        "clinical_focus": "impostor_syndrome",
        "discriminators": {"impostor_syndrome": 2.0},
        "clarifying_question": "你更像是能力本身不自信，还是总怕别人发现自己其实没那么好？",
    },
    "pcl5": {
        "domains": ["trauma"],
        "surface_tags": ["trauma", "intrusion", "avoidance", "hypervigilance", "nightmare"],
        "latent_tags": ["trauma_intrusion"],
        "preferred_when": ["ptsd_pattern"],
        "avoid_when": [],
        "burden_level": "medium",
        "urgency_bias": "medium",
        "assessment_depth": "deep",
        "clinical_focus": "ptsd",
        "discriminators": {"ptsd_pattern": 2.0},
        "clarifying_question": "这些困扰会不会和某件事之后反复想起、噩梦、回避有关？",
    },
    "asrs": {
        "domains": ["attention"],
        "surface_tags": ["attention", "executive_function", "forgetfulness", "restlessness"],
        "latent_tags": ["attention_scatter"],
        "preferred_when": ["adhd_pattern"],
        "avoid_when": [],
        "burden_level": "medium",
        "urgency_bias": "medium",
        "assessment_depth": "brief",
        "clinical_focus": "adhd_screening",
        "discriminators": {"adhd_pattern": 1.8},
        "clarifying_question": "这种状态更像长期注意力分散、拖延和组织困难吗？",
    },
}

SHORT_PREFERENCE_PATTERNS = ["短一点", "简单一点", "快一点", "马上", "尽快"]
DEEP_PREFERENCE_PATTERNS = ["详细", "全面", "更准确", "深入", "完整"]
CHRONIC_PATTERNS = ["长期", "一直", "总是", "经常", "反复", "好几个月", "几年", "老是"]
ACUTE_PATTERNS = ["最近", "这几天", "这两天", "突然", "刚刚", "这一阵", "近一周"]
URGENCY_PATTERNS = ["撑不住", "快崩溃", "受不了了", "很急", "救命", "影响很大"]
EXPLICIT_REQUEST_PATTERNS = [
    r"我需要.*(量表|问卷|测试|评估)",
    r"(推荐|给我|想做|想测|需要|适合).*(量表|问卷|测试|评估)",
    r"(有|来).*(量表|问卷|测试|评估).*吗",
]

SIGNAL_KEYWORDS = {
    "sleep": ["睡不好", "失眠", "睡不着", "睡眠", "入睡", "夜醒", "早醒", "作息"],
    "sleep_initiation": ["入睡困难", "睡不着", "很难睡着", "躺很久"],
    "night_waking": ["夜醒", "半夜醒", "睡到一半醒", "夜里总醒"],
    "early_waking": ["早醒", "醒太早"],
    "sleep_quality": ["睡眠质量", "睡得不好", "睡不踏实", "睡得不踏实", "睡不沉", "休息不好"],
    "daytime_sleepiness": ["白天困", "白天犯困", "很困", "没精神", "乏力", "精力不足", "精力不够"],
    "anxiety": ["焦虑", "紧张", "担心", "不安", "害怕", "慌"],
    "worry": ["担心", "想太多", "停不下来", "脑子停不下来"],
    "somatic_anxiety": ["心慌", "胸闷", "发抖", "头晕", "呼吸不过来", "出汗", "手抖"],
    "panic_pattern": ["突然很慌", "惊恐", "像要死", "突然喘不过气"],
    "depression": ["抑郁", "低落", "提不起劲", "没动力", "情绪很差"],
    "low_mood": ["低落", "难过", "心情很差", "情绪差"],
    "anhedonia": ["没兴趣", "什么都不想做", "开心不起来"],
    "fatigue": ["疲惫", "很累", "乏力", "没精神"],
    "stress": ["压力", "压得喘不过气", "扛不住", "撑不住", "崩溃"],
    "burnout": ["耗尽", "倦怠", "被榨干", "burnout"],
    "general_distress": ["状态不好", "很难受", "乱糟糟", "什么都不对劲"],
    "trauma": ["创伤", "那件事之后", "事故之后", "阴影"],
    "intrusion": ["闪回", "反复想起", "画面会回来"],
    "avoidance": ["回避", "不敢去", "躲着"],
    "hypervigilance": ["容易受惊", "警觉", "绷着"],
    "attention": ["注意力", "分心", "专注不了", "总走神"],
    "executive_function": ["拖延", "做不完", "组织不了", "启动困难"],
    "forgetfulness": ["忘事", "记不住", "丢三落四", "健忘"],
    "compulsive": ["强迫", "反复检查", "洗很多遍", "仪式感动作"],
    "loneliness": ["孤独", "没人懂", "很孤单", "一个人"],
    "social_disconnection": ["没人陪", "没有连接感", "被隔离"],
    "social_anxiety": ["社恐", "社交焦虑", "不敢社交", "一见到人就紧张"],
    "interaction_fear": ["不敢说话", "怕跟人交流", "见人就紧张", "一见到人就紧张"],
    "evaluation_fear": ["怕被评价", "怕别人怎么看我", "担心别人怎么看我", "怕出丑"],
    "stranger_fear": ["怕见陌生人", "见陌生人很紧张"],
    "impostor": ["冒牌货", "怕被发现", "都是运气", "觉得自己是假的"],
    "achievement_doubt": ["不配得", "不是真的厉害", "怕露馅"],
}

LATENT_KEYWORDS = {
    "daily_function_drop": ["影响上课", "影响工作", "白天撑不住", "状态掉很多"],
    "long_term_distress": ["一直这样", "很久了", "长期这样"],
    "brief_screening": ["短一点", "快一点", "先快速看看"],
    "deep_assessment": ["详细", "全面", "更系统", "深入"],
    "mixed_distress": ["什么问题都有", "很多方面都不对劲", "很多方面都出问题"],
    "social_avoidance": ["能躲就躲", "总想躲", "回避社交", "不敢去见人"],
    "social_emptiness": ["没人陪", "没有人可以说", "没有归属感"],
    "hidden_inadequacy": ["怕别人知道我其实不行", "怕露馅", "像假的"],
    "attention_scatter": ["脑子散", "任务开很多", "总走神"],
    "trauma_intrusion": ["老会想起那件事", "会被触发", "画面回来"],
}

def _contains_any(text: str, keywords: list[str]) -> bool:
    return any(keyword in text for keyword in keywords)

def _extract_matches(text: str, keyword_map: dict[str, list[str]]) -> list[str]:
    return [key for key, keywords in keyword_map.items() if _contains_any(text, keywords)]

@lru_cache(maxsize=1)
def load_scale_index() -> list[dict]:
    with open(_INDEX_PATH, encoding="utf-8") as f:
        return json.load(f)

def _infer_burden(question_count: int) -> str:
    if question_count <= 10:
        return "low"
    if question_count <= 24:
        return "medium"
    return "high"

def _infer_depth(question_count: int) -> str:
    if question_count <= 10:
        return "brief"
    if question_count <= 24:
        return "balanced"
    return "deep"

@lru_cache(maxsize=1)
def get_adaptive_scale_catalog() -> list[dict]:
    items = load_scale_index()
    catalog = []
    for item in items:
        code = item["code"].lower()
        qn = QUESTION_COUNTS.get(code, 12)
        policy = POLICY_OVERRIDES.get(code, {})
        catalog.append({
            "code": code,
            "title": item["title"],
            "category": item["category"],
            "symptoms": item.get("symptoms", []),
            "searchable_text": item.get("searchable_text", ""),
            "question_count": qn,
            "burden_level": policy.get("burden_level", _infer_burden(qn)),
            "assessment_depth": policy.get("assessment_depth", _infer_depth(qn)),
            "domains": policy.get("domains", [item["category"]]),
            "clinical_focus": policy.get("clinical_focus", item["category"]),
            "surface_tags": policy.get("surface_tags", []),
            "latent_tags": policy.get("latent_tags", []),
            "preferred_when": policy.get("preferred_when", []),
            "avoid_when": policy.get("avoid_when", []),
            "urgency_bias": policy.get("urgency_bias", "medium"),
            "discriminators": policy.get("discriminators", {}),
            "clarifying_question": policy.get("clarifying_question", ""),
        })
    return catalog

def analyze_message_v2(user_text: str) -> dict:
    text = (user_text or "").strip().lower()
    explicit_request = any(re.search(pattern, text) for pattern in EXPLICIT_REQUEST_PATTERNS)
    direct_signals = _extract_matches(text, SIGNAL_KEYWORDS)
    latent_needs = _extract_matches(text, LATENT_KEYWORDS)
    duration = "chronic" if _contains_any(text, CHRONIC_PATTERNS) else "acute" if _contains_any(text, ACUTE_PATTERNS) else "unknown"
    urgency = "high" if _contains_any(text, URGENCY_PATTERNS) else "medium" if "影响" in text else "low"
    preference_depth = "brief" if _contains_any(text, SHORT_PREFERENCE_PATTERNS) else "deep" if _contains_any(text, DEEP_PREFERENCE_PATTERNS) else "balanced"

    domains = []
    if any(sig in direct_signals for sig in ["sleep", "sleep_initiation", "night_waking", "early_waking", "sleep_quality", "daytime_sleepiness"]):
        domains.append("sleep")
    if any(sig in direct_signals for sig in ["anxiety", "worry", "somatic_anxiety", "panic_pattern"]):
        domains.append("anxiety")
    if any(sig in direct_signals for sig in ["depression", "low_mood", "anhedonia", "fatigue"]):
        domains.append("depression")
    if any(sig in direct_signals for sig in ["stress", "burnout", "general_distress"]):
        domains.append("general_distress")
    if any(sig in direct_signals for sig in ["social_anxiety", "interaction_fear", "evaluation_fear", "stranger_fear"]):
        domains.append("social_anxiety")
    if any(sig in direct_signals for sig in ["loneliness", "social_disconnection"]):
        domains.append("interpersonal")
    if any(sig in direct_signals for sig in ["impostor", "achievement_doubt"]):
        domains.append("self_worth")
    if any(sig in direct_signals for sig in ["trauma", "intrusion", "avoidance", "hypervigilance"]):
        domains.append("trauma")
    if any(sig in direct_signals for sig in ["attention", "executive_function", "forgetfulness"]):
        domains.append("attention")
    if "mixed_distress" in latent_needs and "general_distress" not in domains:
        domains.append("general_distress")

    uncertainty_slots = []
    if "sleep" in domains:
        has_insomnia = any(sig in direct_signals for sig in ["sleep_initiation", "night_waking", "early_waking"])
        has_quality = any(sig in direct_signals for sig in ["sleep_quality", "daytime_sleepiness"])
        if has_insomnia and has_quality:
            uncertainty_slots.append("insomnia_vs_broad_sleep_decline")
        elif not has_insomnia and not has_quality:
            uncertainty_slots.append("sleep_target_unclear")
    if "anxiety" in domains:
        if "somatic_anxiety" in direct_signals or "panic_pattern" in direct_signals:
            uncertainty_slots.append("worry_vs_somatic_anxiety")
    if "social_anxiety" in domains and "interpersonal" in domains:
        uncertainty_slots.append("social_avoidance_vs_loneliness")
    if "general_distress" in domains and len(domains) == 1:
        uncertainty_slots.append("broad_screening_vs_specific_domain")

    return {
        "explicit_request": explicit_request,
        "direct_signals": list(dict.fromkeys(direct_signals)),
        "latent_needs": list(dict.fromkeys(latent_needs)),
        "domains": list(dict.fromkeys(domains)),
        "urgency": urgency,
        "duration": duration,
        "preference_depth": preference_depth,
        "uncertainty_slots": uncertainty_slots,
    }
