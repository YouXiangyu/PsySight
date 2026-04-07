from datetime import datetime
from functools import wraps

from flask import Blueprint, current_app, jsonify, request

from models import (
    AssessmentRecord,
    ConversationMessage,
    ConversationSession,
    Scale,
    User,
    UserProfile,
    db,
)


def _require_internal_token(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = current_app.config.get("INTERNAL_API_TOKEN")
        if not token:
            return jsonify({"error": "internal API not configured"}), 503
        provided = request.headers.get("X-Internal-Token", "")
        if provided != token:
            return jsonify({"error": "unauthorized"}), 401
        return fn(*args, **kwargs)
    return wrapper


def create_internal_blueprint():
    bp = Blueprint("internal_routes", __name__)

    @bp.route("/api/internal/user-profile/<int:user_id>", methods=["GET"])
    @_require_internal_token
    def get_user_profile(user_id: int):
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "user not found"}), 404

        profile = UserProfile.query.filter_by(user_id=user_id).first()

        recent = (
            db.session.query(AssessmentRecord, Scale)
            .join(Scale, Scale.id == AssessmentRecord.scale_id)
            .filter(AssessmentRecord.user_id == user_id)
            .order_by(AssessmentRecord.created_at.desc())
            .limit(5)
            .all()
        )
        recent_assessments = [
            {
                "record_id": rec.id,
                "scale_code": sc.code,
                "scale_title": sc.title,
                "score": rec.total_score,
                "severity": rec.severity_level,
                "date": rec.created_at.isoformat(),
            }
            for rec, sc in recent
        ]

        return jsonify({
            "user_id": user_id,
            "username": user.username,
            "persona": profile.persona if profile else None,
            "communication_style": profile.communication_style if profile else None,
            "core_concerns": profile.core_concerns if profile else [],
            "history_summary": profile.history_summary if profile else None,
            "recent_assessments": recent_assessments,
        }), 200

    @bp.route("/api/internal/user-profile", methods=["POST"])
    @_require_internal_token
    def upsert_user_profile():
        data = request.json or {}
        user_id = data.get("user_id")
        if not user_id:
            return jsonify({"error": "user_id required"}), 400

        profile = UserProfile.query.filter_by(user_id=user_id).first()
        if not profile:
            profile = UserProfile(user_id=user_id)
            db.session.add(profile)

        if "persona" in data:
            profile.persona = data["persona"]
        if "communication_style" in data:
            profile.communication_style = data["communication_style"]
        if "core_concerns" in data:
            profile.core_concerns = data["core_concerns"]
        if "history_summary" in data:
            profile.history_summary = data["history_summary"]
        profile.updated_at = datetime.utcnow()

        db.session.commit()
        return jsonify({"ok": True, "user_id": user_id}), 200

    @bp.route("/api/internal/save-conversation", methods=["POST"])
    @_require_internal_token
    def save_conversation():
        data = request.json or {}
        user_id = data.get("user_id")
        session_id = data.get("session_id")
        messages = data.get("messages", [])

        if not messages:
            return jsonify({"error": "no messages to save"}), 400

        conv = None
        if session_id:
            conv = ConversationSession.query.get(session_id)

        if not conv and user_id:
            first_user_msg = next((m["content"] for m in messages if m.get("role") == "user"), "新对话")
            title = first_user_msg[:20] + ("..." if len(first_user_msg) > 20 else "")
            conv = ConversationSession(user_id=user_id, title=title, is_anonymous=False)
            db.session.add(conv)
            db.session.flush()

        if not conv:
            return jsonify({"error": "cannot create session without user_id"}), 400

        last_assistant_id = None
        for msg in messages:
            row = ConversationMessage(
                session_id=conv.id,
                role=msg.get("role", "user"),
                content=msg.get("content", ""),
                recommended_scale_code=msg.get("recommended_scale_code"),
                recommended_scale_title=msg.get("recommended_scale_title"),
                crisis_flag=bool(msg.get("crisis_flag", False)),
            )
            db.session.add(row)
            db.session.flush()
            if row.role == "assistant":
                last_assistant_id = row.id

        conv.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            "ok": True,
            "session_id": conv.id,
            "assistant_message_id": last_assistant_id,
        }), 200

    @bp.route("/api/internal/conversation/<int:session_id>/messages", methods=["GET"])
    @_require_internal_token
    def get_conversation_messages_internal(session_id: int):
        conv = ConversationSession.query.get(session_id)
        if not conv:
            return jsonify({"error": "session not found"}), 404

        rows = (
            ConversationMessage.query
            .filter_by(session_id=session_id)
            .order_by(ConversationMessage.created_at.asc())
            .all()
        )
        items = [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "recommended_scale_code": msg.recommended_scale_code,
                "crisis_flag": msg.crisis_flag,
                "created_at": msg.created_at.isoformat(),
            }
            for msg in rows
        ]
        return jsonify({"items": items, "session_id": conv.id, "user_id": conv.user_id}), 200

    @bp.route("/api/internal/scales", methods=["GET"])
    @_require_internal_token
    def list_scales_internal():
        scales = Scale.query.all()
        items = [
            {
                "id": s.id,
                "code": s.code,
                "title": s.title,
                "category": s.category,
                "description": s.description,
            }
            for s in scales
        ]
        return jsonify({"items": items}), 200

    return bp
