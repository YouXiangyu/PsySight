from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from retrieval.loader import SCALES_DATA_DIR, load_scale_index


CATALOG_OVERRIDES: dict[str, dict] = {
    "ais": {
        "domains": ["sleep"],
        "focus_tags": ["sleep", "insomnia", "sleep_initiation", "night_waking", "early_waking"],
        "signal_weights": {
            "sleep": 1.8,
            "insomnia": 4.5,
            "sleep_initiation": 4.0,
            "night_waking": 3.0,
            "early_waking": 3.5,
            "chronic_sleep": 2.5,
            "urgent_screening": 1.2,
        },
        "latent_weights": {
            "sleep_control_loss": 1.5,
            "long_term_distress": 1.5,
        },
        "question_style": "targeted",
        "assessment_depth": "brief",
        "clinical_focus": "insomnia",
        "clarifying_question": "这种睡不好更像长期入睡困难、半夜醒来或早醒，还是最近整体睡眠质量下降？",
        "summary_hint": "Best when the user clearly describes insomnia-like symptoms and wants a faster screening tool.",
    },
    "psqi": {
        "domains": ["sleep"],
        "focus_tags": ["sleep", "sleep_quality", "sleep_duration", "daytime_sleepiness", "dream_disturbance"],
        "signal_weights": {
            "sleep": 1.8,
            "sleep_quality": 4.2,
            "sleep_duration": 3.0,
            "daytime_sleepiness": 3.0,
            "dream_disturbance": 2.4,
            "recent_poor_sleep": 2.0,
            "deep_assessment": 1.6,
        },
        "latent_weights": {
            "daily_function_drop": 1.5,
            "broad_sleep_impact": 1.5,
        },
        "question_style": "comprehensive",
        "assessment_depth": "deep",
        "clinical_focus": "sleep_quality",
        "clarifying_question": "你更困扰的是长期失眠样问题，还是最近整体睡眠质量和白天状态一起变差？",
        "summary_hint": "Best when the user describes broad sleep-quality decline, daytime sleepiness, or wants a more complete sleep assessment.",
    },
    "gad7": {
        "domains": ["anxiety"],
        "focus_tags": ["anxiety", "worry", "tension", "restlessness"],
        "signal_weights": {
            "anxiety": 3.6,
            "worry": 3.6,
            "tension": 2.8,
            "restlessness": 2.8,
            "brief_screening": 1.5,
        },
        "latent_weights": {
            "anticipatory_fear": 1.4,
            "mental_overload": 1.2,
        },
        "question_style": "targeted",
        "assessment_depth": "brief",
        "clinical_focus": "general_anxiety",
        "clarifying_question": "这种不安更像持续停不下来的担心，还是一阵阵会突然冲上来的惊慌反应？",
        "summary_hint": "Best when the user mainly reports chronic worry or generalized anxiety.",
    },
    "sas": {
        "domains": ["anxiety"],
        "focus_tags": ["anxiety", "somatic_anxiety", "panic_pattern", "restlessness"],
        "signal_weights": {
            "anxiety": 2.6,
            "somatic_anxiety": 3.8,
            "panic_pattern": 3.0,
            "restlessness": 2.4,
            "deep_assessment": 1.2,
        },
        "latent_weights": {
            "body_alarm": 1.8,
            "panic_pattern": 1.5,
        },
        "question_style": "somatic",
        "assessment_depth": "balanced",
        "clinical_focus": "somatic_anxiety",
        "summary_hint": "Best when anxiety is expressed through bodily symptoms such as palpitations, shaking, breathlessness, or dizziness.",
    },
    "phq9": {
        "domains": ["depression"],
        "focus_tags": ["depression", "low_mood", "anhedonia", "hopelessness", "fatigue"],
        "signal_weights": {
            "depression": 3.8,
            "low_mood": 3.6,
            "anhedonia": 3.8,
            "hopelessness": 3.2,
            "fatigue": 1.8,
            "brief_screening": 1.5,
        },
        "latent_weights": {
            "self_worth_drop": 1.4,
            "shutdown_state": 1.4,
        },
        "question_style": "targeted",
        "assessment_depth": "brief",
        "clinical_focus": "depression_screening",
        "summary_hint": "Best when the user likely needs a concise depression screening first.",
    },
    "sds": {
        "domains": ["depression"],
        "focus_tags": ["depression", "low_mood", "fatigue", "tearfulness", "self_worth"],
        "signal_weights": {
            "depression": 2.8,
            "low_mood": 2.8,
            "fatigue": 2.2,
            "tearfulness": 2.8,
            "self_worth": 2.4,
            "deep_assessment": 1.2,
        },
        "latent_weights": {
            "self_worth_drop": 1.6,
            "shutdown_state": 1.2,
        },
        "question_style": "broad",
        "assessment_depth": "balanced",
        "clinical_focus": "depression_depth",
        "summary_hint": "Best when depressive symptoms are broad and the user wants more nuance than a minimal screen.",
    },
    "bdi2": {
        "domains": ["depression"],
        "focus_tags": ["depression", "hopelessness", "self_worth", "anhedonia", "fatigue"],
        "signal_weights": {
            "depression": 3.0,
            "hopelessness": 3.2,
            "self_worth": 3.0,
            "anhedonia": 3.0,
            "deep_assessment": 1.8,
        },
        "latent_weights": {
            "self_worth_drop": 1.8,
            "shutdown_state": 1.5,
        },
        "question_style": "clinical",
        "assessment_depth": "deep",
        "clinical_focus": "depression_depth",
        "summary_hint": "Best when the user wants a deeper, more detailed depression-focused assessment.",
    },
    "dass21": {
        "domains": ["stress", "anxiety", "depression"],
        "focus_tags": ["stress", "anxiety", "depression", "burnout", "general_distress"],
        "signal_weights": {
            "stress": 3.4,
            "anxiety": 2.4,
            "depression": 2.4,
            "burnout": 2.6,
            "general_distress": 2.0,
        },
        "latent_weights": {
            "mental_overload": 1.6,
            "mixed_distress": 1.8,
        },
        "question_style": "triage",
        "assessment_depth": "balanced",
        "clinical_focus": "mixed_distress",
        "summary_hint": "Best when the user shows a mixed picture of stress, anxiety, and low mood instead of one clear domain.",
    },
    "scl90": {
        "domains": ["broad_screening"],
        "focus_tags": ["general_distress", "somatic_anxiety", "depression", "anxiety", "compulsive", "interpersonal"],
        "signal_weights": {
            "general_distress": 3.5,
            "mixed_distress": 3.0,
            "interpersonal": 1.8,
            "compulsive": 2.0,
            "deep_assessment": 2.0,
        },
        "latent_weights": {
            "complex_case": 2.2,
            "multi_domain_distress": 2.0,
        },
        "question_style": "comprehensive",
        "assessment_depth": "deep",
        "clinical_focus": "broad_screening",
        "summary_hint": "Best when symptoms span multiple domains and a broad inventory is more appropriate than a single-domain scale.",
    },
    "k10": {
        "domains": ["general_distress"],
        "focus_tags": ["general_distress", "stress", "anxiety", "depression"],
        "signal_weights": {
            "general_distress": 3.0,
            "stress": 2.2,
            "anxiety": 2.0,
            "depression": 2.0,
            "brief_screening": 1.2,
        },
        "latent_weights": {
            "mixed_distress": 1.6,
        },
        "question_style": "screening",
        "assessment_depth": "brief",
        "clinical_focus": "general_distress",
        "summary_hint": "Best when the user feels broadly overwhelmed but does not yet show a clear single-domain target.",
    },
    "pcl5": {
        "domains": ["trauma"],
        "focus_tags": ["trauma", "intrusion", "avoidance", "hypervigilance", "nightmare"],
        "signal_weights": {
            "trauma": 3.8,
            "intrusion": 3.5,
            "avoidance": 3.0,
            "hypervigilance": 3.2,
            "nightmare": 2.4,
        },
        "latent_weights": {
            "trauma_intrusion": 2.0,
        },
        "question_style": "clinical",
        "assessment_depth": "deep",
        "clinical_focus": "ptsd",
        "summary_hint": "Best when the user clearly hints at trauma reminders, flashbacks, avoidance, or hypervigilance.",
    },
    "iesr": {
        "domains": ["trauma"],
        "focus_tags": ["trauma", "intrusion", "avoidance", "nightmare"],
        "signal_weights": {
            "trauma": 3.0,
            "intrusion": 3.0,
            "avoidance": 2.4,
            "nightmare": 2.2,
            "brief_screening": 1.0,
        },
        "latent_weights": {
            "trauma_intrusion": 1.4,
        },
        "question_style": "event_impact",
        "assessment_depth": "balanced",
        "clinical_focus": "trauma_impact",
        "summary_hint": "Best when the user is talking about a stressful event's impact but the PTSD pattern is not fully clear yet.",
    },
    "asrs": {
        "domains": ["attention"],
        "focus_tags": ["attention", "executive_function", "forgetfulness", "restlessness"],
        "signal_weights": {
            "attention": 3.8,
            "executive_function": 3.2,
            "forgetfulness": 2.8,
            "restlessness": 2.0,
        },
        "latent_weights": {
            "attention_scatter": 2.0,
        },
        "question_style": "targeted",
        "assessment_depth": "brief",
        "clinical_focus": "adhd_screening",
        "summary_hint": "Best when the user reports attention drift, forgetfulness, task completion issues, or chronic distractibility.",
    },
    "mdq": {
        "domains": ["mood_activation"],
        "focus_tags": ["mania_activation", "impulsivity", "reduced_sleep_need", "mood_swings"],
        "signal_weights": {
            "mania_activation": 4.0,
            "impulsivity": 2.5,
            "reduced_sleep_need": 3.2,
            "mood_swings": 2.6,
        },
        "latent_weights": {
            "activation_pattern": 2.0,
        },
        "question_style": "targeted",
        "assessment_depth": "brief",
        "clinical_focus": "bipolar_screening",
        "summary_hint": "Best when the user hints at elevated energy, reduced need for sleep, impulsive spending, or unusual activation periods.",
    },
    "ybocs": {
        "domains": ["compulsive"],
        "focus_tags": ["compulsive", "obsession", "repetition", "control_loss"],
        "signal_weights": {
            "compulsive": 4.0,
            "obsession": 3.2,
            "repetition": 3.2,
            "control_loss": 2.4,
        },
        "latent_weights": {
            "compulsive_pattern": 2.0,
        },
        "question_style": "targeted",
        "assessment_depth": "deep",
        "clinical_focus": "ocd",
        "summary_hint": "Best when the user describes repetitive thoughts, checking, cleaning, rituals, or loss of control over repeated actions.",
    },
    "ucla": {
        "domains": ["interpersonal"],
        "focus_tags": ["loneliness", "social_disconnection"],
        "signal_weights": {
            "loneliness": 4.0,
            "social_disconnection": 3.0,
        },
        "latent_weights": {
            "social_emptiness": 1.8,
        },
        "question_style": "focused",
        "assessment_depth": "balanced",
        "clinical_focus": "loneliness",
        "summary_hint": "Best when the main issue is feeling lonely, disconnected, or lacking emotional companionship.",
    },
    "sias": {
        "domains": ["social_anxiety"],
        "focus_tags": ["social_anxiety", "interaction_fear", "evaluation_fear"],
        "signal_weights": {
            "social_anxiety": 4.0,
            "interaction_fear": 3.0,
            "evaluation_fear": 2.8,
        },
        "latent_weights": {
            "social_avoidance": 2.0,
        },
        "question_style": "targeted",
        "assessment_depth": "balanced",
        "clinical_focus": "social_interaction_anxiety",
        "summary_hint": "Best when the user fears interaction itself, not just speaking in public.",
    },
    "ias": {
        "domains": ["social_anxiety"],
        "focus_tags": ["social_anxiety", "stranger_fear", "interaction_fear"],
        "signal_weights": {
            "social_anxiety": 3.4,
            "stranger_fear": 3.2,
            "interaction_fear": 2.4,
        },
        "latent_weights": {
            "social_avoidance": 1.6,
        },
        "question_style": "targeted",
        "assessment_depth": "brief",
        "clinical_focus": "interpersonal_anxiety",
        "summary_hint": "Best when the user describes general nervousness around meeting people or being watched.",
    },
    "is": {
        "domains": ["self_worth"],
        "focus_tags": ["impostor", "self_worth", "achievement_doubt"],
        "signal_weights": {
            "impostor": 5.0,
            "self_worth": 2.8,
            "achievement_doubt": 3.8,
        },
        "latent_weights": {
            "hidden_inadequacy": 2.4,
        },
        "question_style": "focused",
        "assessment_depth": "balanced",
        "clinical_focus": "impostor_syndrome",
        "summary_hint": "Best when the user sounds competent on the surface but repeatedly fears being exposed as not good enough.",
    },
    "upi": {
        "domains": ["broad_screening"],
        "focus_tags": ["general_distress", "college_adjustment", "sleep", "anxiety", "depression"],
        "signal_weights": {
            "general_distress": 2.6,
            "college_adjustment": 3.4,
            "sleep": 1.4,
            "anxiety": 1.4,
            "depression": 1.4,
        },
        "latent_weights": {
            "student_pressure": 2.2,
        },
        "question_style": "screening",
        "assessment_depth": "deep",
        "clinical_focus": "student_screening",
        "summary_hint": "Best when the user is a student with diffuse mental-health, adaptation, or campus-life difficulties.",
    },
}


@lru_cache(maxsize=1)
def _load_backend_scale_meta() -> dict[str, dict]:
    meta: dict[str, dict] = {}
    if not SCALES_DATA_DIR.exists():
        return meta

    for path in SCALES_DATA_DIR.glob("*.json"):
        try:
            with open(path, encoding="utf-8") as f:
                payload = json.load(f)
        except Exception:
            continue
        meta[path.stem.lower()] = {
            "question_count": len(payload.get("questions") or []),
            "title": payload.get("title", path.stem),
            "description": payload.get("description", ""),
        }
    return meta


def _infer_length_bucket(question_count: int) -> str:
    if question_count <= 10:
        return "short"
    if question_count <= 24:
        return "medium"
    return "long"


def _infer_depth(question_count: int) -> str:
    if question_count <= 10:
        return "brief"
    if question_count <= 24:
        return "balanced"
    return "deep"


def _build_default_aliases(code: str, title: str, category: str) -> list[str]:
    aliases = {code.lower(), title.lower(), category.lower()}
    if "psqi" in code.lower():
        aliases.update({"匹兹堡", "睡眠质量", "匹兹堡睡眠质量指数"})
    if code.lower() == "ais":
        aliases.update({"阿森斯", "失眠指数", "失眠量表"})
    if code.lower() == "gad7":
        aliases.update({"焦虑量表", "焦虑问卷", "焦虑筛查"})
    if code.lower() == "phq9":
        aliases.update({"抑郁量表", "抑郁问卷", "抑郁筛查"})
    if code.lower() == "dass21":
        aliases.update({"压力焦虑抑郁", "情绪压力量表"})
    if code.lower() == "scl90":
        aliases.update({"症状自评", "综合量表"})
    return sorted(alias for alias in aliases if alias)


@lru_cache(maxsize=1)
def get_scale_catalog() -> list[dict]:
    base_items = load_scale_index()
    backend_meta = _load_backend_scale_meta()
    catalog: list[dict] = []

    for item in base_items:
        code = (item.get("code") or "").lower()
        title = item.get("title") or code
        category = item.get("category") or "general"
        backend_item = backend_meta.get(code, {})
        question_count = int(backend_item.get("question_count") or item.get("question_count") or 0)
        overrides = CATALOG_OVERRIDES.get(code, {})
        domains = overrides.get("domains") or [category.lower()]

        catalog.append({
            **item,
            "code": code,
            "title": backend_item.get("title") or title,
            "description": backend_item.get("description") or item.get("description") or "",
            "question_count": question_count,
            "length_bucket": overrides.get("length_bucket") or _infer_length_bucket(question_count),
            "assessment_depth": overrides.get("assessment_depth") or _infer_depth(question_count),
            "question_style": overrides.get("question_style") or "balanced",
            "clinical_focus": overrides.get("clinical_focus") or domains[0],
            "domains": domains,
            "focus_tags": overrides.get("focus_tags") or [],
            "signal_weights": overrides.get("signal_weights") or {},
            "latent_weights": overrides.get("latent_weights") or {},
            "clarifying_question": overrides.get("clarifying_question") or "",
            "summary_hint": overrides.get("summary_hint") or "",
            "aliases": overrides.get("aliases") or _build_default_aliases(code, title, category),
        })

    return catalog
