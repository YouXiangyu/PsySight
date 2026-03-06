from flask import Blueprint, jsonify, request

from application.services.context_service import get_current_user
from application.services.conversation_service import (
    create_conversation,
    get_conversation_messages,
    list_conversations,
    save_message_feedback,
)


def create_conversation_blueprint():
    bp = Blueprint("conversation_routes", __name__)

    @bp.route("/api/conversations", methods=["GET"])
    def list_conversations_api():
        user = get_current_user()
        if not user:
            return jsonify({"items": []})
        return jsonify(list_conversations(user.id))

    @bp.route("/api/conversations", methods=["POST"])
    def create_conversation_api():
        user = get_current_user()
        if not user:
            return jsonify({"error": "请先登录"}), 401
        data = request.json or {}
        title = (data.get("title") or "新对话").strip()
        return jsonify(create_conversation(user.id, title))

    @bp.route("/api/conversations/<int:session_id>/messages", methods=["GET"])
    def get_messages_api(session_id: int):
        user = get_current_user()
        if not user:
            return jsonify({"error": "请先登录"}), 401
        return jsonify(get_conversation_messages(user.id, session_id))

    @bp.route("/api/messages/<int:message_id>/feedback", methods=["POST"])
    def feedback_api(message_id: int):
        data = request.json or {}
        feedback = data.get("feedback")
        if feedback not in ("up", "down"):
            return jsonify({"error": "feedback 仅支持 up/down"}), 400
        user = get_current_user()
        user_id = user.id if user else None
        return jsonify(save_message_feedback(message_id, feedback, user_id))

    return bp
