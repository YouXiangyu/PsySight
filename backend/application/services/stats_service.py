from typing import Dict, Optional

from domain.rules.user_display_rules import get_user_public_name
from models import AssessmentRecord, Scale, User, db


def get_stats_summary() -> Dict:
    visible_filter = (AssessmentRecord.hidden_from_stats.is_(False)) | (AssessmentRecord.hidden_from_stats.is_(None))
    rows = (
        db.session.query(AssessmentRecord, Scale, User)
        .join(Scale, Scale.id == AssessmentRecord.scale_id)
        .outerjoin(User, User.id == AssessmentRecord.user_id)
        .filter(visible_filter)
        .all()
    )

    by_scale: Dict[str, Dict[str, int]] = {}
    age_distribution = {
        "18岁以下": 0,
        "18-22岁": 0,
        "23-26岁": 0,
        "27岁及以上": 0,
        "未填写": 0,
    }
    gender_distribution: Dict[str, int] = {}
    region_distribution: Dict[str, int] = {}
    participant_map: Dict[int, Dict[str, object]] = {}
    word_weights: Dict[str, int] = {}

    def add_word(word: str, weight: int = 1) -> None:
        word_weights[word] = word_weights.get(word, 0) + weight

    def get_age_bucket(age: Optional[int]) -> str:
        if age is None:
            return "未填写"
        if age < 18:
            return "18岁以下"
        if age <= 22:
            return "18-22岁"
        if age <= 26:
            return "23-26岁"
        return "27岁及以上"

    for record, scale, user in rows:
        code = (scale.code or "").lower()
        total_score = int(record.total_score or 0)
        by_scale.setdefault(code, {"total": 0, "severe": 0})
        by_scale[code]["total"] += 1
        severe_threshold = 7 if code == "ais" else 10
        if total_score >= severe_threshold:
            by_scale[code]["severe"] += 1

        if user:
            age_label = get_age_bucket(user.age)
            age_distribution[age_label] = age_distribution.get(age_label, 0) + 1

            gender_label = (user.gender or "").strip() or "未填写"
            gender_distribution[gender_label] = gender_distribution.get(gender_label, 0) + 1

            region_label = (user.region or "").strip() or "未填写"
            region_distribution[region_label] = region_distribution.get(region_label, 0) + 1

            if user.id not in participant_map:
                participant_map[user.id] = {
                    "name": get_user_public_name(user),
                    "region": region_label,
                    "reports": 0,
                }
            participant_map[user.id]["reports"] = int(participant_map[user.id]["reports"]) + 1

        if code == "ais":
            add_word("睡眠")
            if total_score >= 7:
                add_word("失眠", 3)
                add_word("作息紊乱", 2)
        elif code == "gad7":
            add_word("焦虑")
            if total_score >= 10:
                add_word("紧张", 2)
                add_word("担忧", 2)
        elif code == "phq9":
            add_word("情绪低落")
            if total_score >= 10:
                add_word("抑郁风险", 3)
                add_word("动力下降", 2)

        if (record.severity_level or "") in ("中度", "中重度", "重度"):
            add_word("需要支持", 2)
            add_word("心理健康", 1)

    total_records = len(rows)

    def ratio(scale_code: str) -> int:
        total = by_scale.get(scale_code, {}).get("total", 0)
        severe = by_scale.get(scale_code, {}).get("severe", 0)
        if total == 0:
            return 0
        return int(round(severe * 100 / total))

    cards = [
        {"label": "有明显失眠困扰的同龄人", "value": f"{ratio('ais')}%"},
        {"label": "中高焦虑水平的同龄人", "value": f"{ratio('gad7')}%"},
        {"label": "中高抑郁风险的同龄人", "value": f"{ratio('phq9')}%"},
    ]

    demographics = {
        "age_groups": [{"label": label, "value": value} for label, value in age_distribution.items()],
        "genders": [
            {"label": label, "value": value}
            for label, value in sorted(gender_distribution.items(), key=lambda item: item[1], reverse=True)
        ],
        "regions": [
            {"label": label, "value": value}
            for label, value in sorted(region_distribution.items(), key=lambda item: item[1], reverse=True)[:10]
        ],
        "participants": sorted(participant_map.values(), key=lambda item: int(item["reports"]), reverse=True)[:12],
    }
    wordcloud = [
        {"text": label, "weight": weight}
        for label, weight in sorted(word_weights.items(), key=lambda item: item[1], reverse=True)[:24]
    ]

    return {
        "based_on_n": total_records,
        "cards": cards,
        "overview": {"cards": cards},
        "demographics": demographics,
        "wordcloud": wordcloud,
    }
