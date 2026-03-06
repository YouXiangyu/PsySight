from typing import Dict, Optional, Tuple

from application.services.conversation_service import (
    append_conversation_messages,
    build_or_get_chat_session,
    get_recent_context_messages,
)
from application.services.scale_service import get_scale_by_code
from domain.rules.crisis_rules import EMERGENCY_HOTLINES, detect_crisis_keywords
from domain.rules.scale_rules import recommend_scale_code_by_rules
from infrastructure.ai.client import call_deepseek
from infrastructure.ai.fallbacks import build_default_reply
from infrastructure.ai.parsers import (
    extract_json,
    extract_plain_reply,
    extract_recommended_scale_code_from_raw,
    normalize_recommended_scale_code,
)
from infrastructure.ai.prompts import build_triage_prompt
from models import CrisisEvent, db


def handle_chat_request(data: Dict, user, app_config) -> Tuple[Dict, int]:
    user_message = (data.get("message") or "").strip()
    session_id = data.get("session_id")
    anonymous = bool(data.get("anonymous", False))

    if not user_message:
        return {"error": "消息不能为空"}, 400

    if not user:
        anonymous = True

    conv = None
    context_messages = []
    if user and not anonymous:
        conv = build_or_get_chat_session(user.id, user_message, session_id)
        if session_id and not conv:
            return {"error": "会话不存在或无权限"}, 404
        context_messages = get_recent_context_messages(conv.id)

    context_text = "\n".join([f"{item.role}: {item.content}" for item in context_messages])
    matched_keywords = detect_crisis_keywords(user_message)
    rule_scale_code = recommend_scale_code_by_rules(user_message)

    ai_content = call_deepseek(
        app_config,
        build_triage_prompt(),
        (
            f"用户输入：{user_message}\n"
            f"历史上下文：{context_text if context_text else '无'}\n"
            f"规则初步推荐：{rule_scale_code or 'null'}\n"
            "请先完成自然共情回复，再给出 recommended_scale_code。"
        ),
        max_tokens=520,
        temperature=0.55,
    )
    parsed = extract_json(ai_content)
    reply = parsed.get("reply") if isinstance(parsed, dict) else None
    if not reply:
        reply = extract_plain_reply(ai_content)
    if not reply:
        reply = build_default_reply(user_message)

    model_scale_code = parsed.get("recommended_scale_code") if isinstance(parsed, dict) else None
    if not model_scale_code and ai_content:
        model_scale_code = extract_recommended_scale_code_from_raw(ai_content)
    model_scale_code = normalize_recommended_scale_code(model_scale_code)
    recommended_code = model_scale_code or rule_scale_code
    recommended_scale = get_scale_by_code(recommended_code)

    assistant_message_id: Optional[int] = None
    if conv:
        assistant_message_id = append_conversation_messages(
            conv=conv,
            user_message=user_message,
            reply=reply,
            recommended_scale_code=recommended_scale.code if recommended_scale else None,
            recommended_scale_title=recommended_scale.title if recommended_scale else None,
            crisis_flag=bool(matched_keywords),
        )

    if matched_keywords:
        db.session.add(
            CrisisEvent(
                user_id=user.id if user else None,
                session_id=conv.id if conv else None,
                trigger_text=user_message,
                matched_keywords=matched_keywords,
            )
        )

    db.session.commit()

    response = {
        "reply": reply,
        "session_id": conv.id if conv else None,
        "assistant_message_id": assistant_message_id,
        "recommended_scale": (
            {
                "id": recommended_scale.id,
                "code": recommended_scale.code,
                "title": recommended_scale.title,
            }
            if recommended_scale
            else None
        ),
        "crisis_alert": {
            "show": bool(matched_keywords),
            "keywords": matched_keywords,
            "persistent": bool(matched_keywords),
            "hotlines": EMERGENCY_HOTLINES[:2],
            "message": "你不是一个人。现在请优先联系专业支持，我们在这里陪你。",
        },
    }
    return response, 200
