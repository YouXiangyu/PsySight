from flask import Blueprint, current_app, jsonify, request

from application.services.chat_service import handle_chat_request
from application.services.context_service import get_current_user


def create_chat_blueprint():
    bp = Blueprint("chat_routes", __name__)

    @bp.route("/api/chat", methods=["POST"])
    def chat():
        user = get_current_user()
        payload, status = handle_chat_request(request.json or {}, user, current_app.config)
        return jsonify(payload), status

    return bp
