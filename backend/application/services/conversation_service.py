from datetime import datetime
from typing import Dict, List, Optional

from application.services.scale_service import get_scale_by_code
from models import ConversationMessage, ConversationSession, MessageFeedback, db


def list_conversations(user_id: int) -> Dict:
    sessions = (
        ConversationSession.query.filter_by(user_id=user_id, is_anonymous=False)
        .order_by(ConversationSession.updated_at.desc())
        .limit(30)
        .all()
    )
    items = [
        {
            "id": item.id,
            "title": item.title,
            "created_at": item.created_at.isoformat(),
            "updated_at": item.updated_at.isoformat(),
        }
        for item in sessions
    ]
    return {"items": items}


def create_conversation(user_id: int, title: str) -> Dict:
    chat = ConversationSession(user_id=user_id, title=title[:120], is_anonymous=False)
    db.session.add(chat)
    db.session.commit()
    return {"id": chat.id, "title": chat.title}


def get_conversation_messages(user_id: int, session_id: int) -> Dict:
    conv = ConversationSession.query.filter_by(id=session_id, user_id=user_id).first_or_404()
    rows = ConversationMessage.query.filter_by(session_id=conv.id).order_by(ConversationMessage.created_at.asc()).all()
    items: List[Dict] = []
    for msg in rows:
        scale_payload = None
        if msg.recommended_scale_code:
            scale = get_scale_by_code(msg.recommended_scale_code)
            scale_payload = {
                "id": scale.id if scale else None,
                "code": msg.recommended_scale_code,
                "title": msg.recommended_scale_title,
            }
        items.append(
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "recommended_scale": scale_payload,
                "created_at": msg.created_at.isoformat(),
            }
        )
    return {"items": items, "session_id": conv.id, "title": conv.title}


def save_message_feedback(message_id: int, feedback: str, user_id: Optional[int]) -> Dict:
    message = ConversationMessage.query.get_or_404(message_id)

    existing = MessageFeedback.query.filter_by(message_id=message.id, user_id=user_id).first()
    if existing:
        existing.feedback = feedback
    else:
        db.session.add(MessageFeedback(message_id=message.id, user_id=user_id, feedback=feedback))
    db.session.commit()
    return {"ok": True}


def build_or_get_chat_session(user_id: int, user_message: str, session_id: Optional[int]) -> Optional[ConversationSession]:
    if session_id:
        return ConversationSession.query.filter_by(id=session_id, user_id=user_id).first()
    conv = ConversationSession(
        user_id=user_id,
        title=user_message[:20] + ("..." if len(user_message) > 20 else ""),
        is_anonymous=False,
    )
    db.session.add(conv)
    db.session.flush()
    return conv


def get_recent_context_messages(conv_id: int) -> List[ConversationMessage]:
    return (
        ConversationMessage.query.filter_by(session_id=conv_id)
        .order_by(ConversationMessage.created_at.desc())
        .limit(6)
        .all()[::-1]
    )


def append_conversation_messages(
    conv: ConversationSession,
    user_message: str,
    reply: str,
    recommended_scale_code: Optional[str],
    recommended_scale_title: Optional[str],
    crisis_flag: bool,
) -> Optional[int]:
    user_message_row = ConversationMessage(
        session_id=conv.id,
        role="user",
        content=user_message,
        crisis_flag=crisis_flag,
    )
    db.session.add(user_message_row)
    assistant_message_row = ConversationMessage(
        session_id=conv.id,
        role="assistant",
        content=reply,
        recommended_scale_code=recommended_scale_code,
        recommended_scale_title=recommended_scale_title,
        crisis_flag=crisis_flag,
    )
    db.session.add(assistant_message_row)
    conv.updated_at = datetime.utcnow()
    return assistant_message_row.id
