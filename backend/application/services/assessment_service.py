import json
from typing import Dict, Tuple

from application.services.scale_service import get_scale_by_code, serialize_scale
from domain.rules.report_rules import build_default_report
from domain.rules.severity_rules import explain_severity, get_severity_level, get_urgent_recommendation
from domain.rules.user_display_rules import get_user_public_name
from infrastructure.ai.client import call_deepseek
from infrastructure.ai.prompts import build_report_prompt
from models import AssessmentRecord, Scale, User, db


def submit_assessment(data: Dict, user, app_config) -> Tuple[Dict, int]:
    scale_id = data.get("scale_id")
    scale_code = data.get("scale_code")
    answers = data.get("answers") or {}
    emotion_log = data.get("emotion_log") or {}
    emotion_consent = bool(data.get("emotion_consent", False))
    anonymous = bool(data.get("anonymous", False))

    scale = None
    if scale_id:
        scale = Scale.query.get(scale_id)
    if not scale and scale_code:
        scale = get_scale_by_code(scale_code)
    if not scale:
        return {"error": "量表不存在"}, 404

    try:
        total_score = sum(int(value) for value in answers.values())
    except Exception:
        return {"error": "answers 格式错误"}, 400

    if not emotion_consent:
        emotion_log = {}

    severity_level = get_severity_level(scale.code, total_score)
    urgent_recommendation = get_urgent_recommendation(scale.code, total_score)
    score_explanation = explain_severity(severity_level)
    report_input = (
        f"量表：{scale.title}\n"
        f"得分：{total_score}\n"
        f"分级：{severity_level}\n"
        f"分级解释：{score_explanation}\n"
        f"评分规则：{scale.scoring_rules}\n"
        f"情绪聚合：{json.dumps(emotion_log, ensure_ascii=False)}\n"
        f"危机提示：{urgent_recommendation or '无'}"
    )
    ai_report = call_deepseek(app_config, build_report_prompt(), report_input, max_tokens=900, temperature=0.5)
    if not ai_report:
        ai_report = build_default_report(scale, total_score, severity_level, emotion_log, urgent_recommendation)

    record = AssessmentRecord(
        user_id=None if anonymous or not user else user.id,
        scale_id=scale.id,
        total_score=total_score,
        severity_level=severity_level,
        user_answers=answers,
        emotion_log=emotion_log,
        emotion_consent=emotion_consent,
        ai_report=ai_report,
    )
    db.session.add(record)
    db.session.commit()

    return (
        {
            "record_id": record.id,
            "total_score": total_score,
            "severity_level": severity_level,
            "score_explanation": score_explanation,
            "urgent_recommendation": urgent_recommendation,
            "ai_report": ai_report,
        },
        200,
    )


def get_report(record_id: int, current_user) -> Tuple[Dict, int]:
    record = AssessmentRecord.query.get_or_404(record_id)
    is_anonymous_record = record.user_id is None
    if not is_anonymous_record:
        if not current_user or current_user.id != record.user_id:
            return {"error": "无权限查看该报告"}, 403

    scale = Scale.query.get(record.scale_id)
    urgent = get_urgent_recommendation(scale.code if scale else "", record.total_score or 0)
    owner = User.query.get(record.user_id) if record.user_id else None
    owner_name = owner.username if owner else "匿名用户"
    owner_public_name = get_user_public_name(owner)
    return (
        {
            "id": record.id,
            "scale": serialize_scale(scale) if scale else None,
            "total_score": record.total_score,
            "severity_level": record.severity_level,
            "score_explanation": explain_severity(record.severity_level or "待评估"),
            "urgent_recommendation": urgent,
            "ai_report": record.ai_report,
            "emotion_log": record.emotion_log or {},
            "emotion_consent": bool(record.emotion_consent),
            "anonymous": is_anonymous_record,
            "owner": (
                {
                    "id": owner.id,
                    "username": owner_name,
                    "public_name": owner_public_name,
                }
                if owner
                else None
            ),
            "hidden_from_stats": bool(record.hidden_from_stats),
            "created_at": record.created_at.isoformat(),
        },
        200,
    )


def list_my_reports(user, limit: int, offset: int) -> Dict:
    rows = (
        db.session.query(AssessmentRecord, Scale)
        .join(Scale, Scale.id == AssessmentRecord.scale_id)
        .filter(AssessmentRecord.user_id == user.id)
        .order_by(AssessmentRecord.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    items = []
    for record, scale in rows:
        items.append(
            {
                "id": record.id,
                "scale": serialize_scale(scale),
                "total_score": record.total_score,
                "severity_level": record.severity_level,
                "score_explanation": explain_severity(record.severity_level or "待评估"),
                "created_at": record.created_at.isoformat(),
                "hidden_from_stats": bool(record.hidden_from_stats),
            }
        )
    return {"items": items, "count": len(items)}


def set_report_stats_visibility(record_id: int, user, hidden: bool) -> Tuple[Dict, int]:
    record = AssessmentRecord.query.filter_by(id=record_id, user_id=user.id).first()
    if not record:
        return {"error": "报告不存在或无权限"}, 404
    record.hidden_from_stats = hidden
    db.session.commit()
    return {"ok": True, "record_id": record.id, "hidden_from_stats": bool(record.hidden_from_stats)}, 200
