from flask import Blueprint, jsonify, request

from application.services.auth_service import (
    login_user,
    register_user,
    serialize_user,
    update_profile,
    validate_register_payload,
)
from application.services.context_service import clear_session, get_current_user, set_session_user


def create_auth_blueprint():
    bp = Blueprint("auth_routes", __name__)

    @bp.route("/api/auth/register", methods=["POST"])
    def register():
        data = request.json or {}
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        username = (data.get("username") or "").strip() or email.split("@")[0]

        validation_error = validate_register_payload(email, password)
        if validation_error:
            payload, status = validation_error
            return jsonify(payload), status

        user = register_user(email, password, username)
        set_session_user(user.id)
        return jsonify({"id": user.id, "email": user.email, "username": user.username})

    @bp.route("/api/auth/login", methods=["POST"])
    def login():
        data = request.json or {}
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        user = login_user(email, password)
        if not user:
            return jsonify({"error": "邮箱或密码错误"}), 401
        set_session_user(user.id)
        return jsonify({"id": user.id, "email": user.email, "username": user.username})

    @bp.route("/api/auth/logout", methods=["POST"])
    def logout():
        clear_session()
        return jsonify({"ok": True})

    @bp.route("/api/auth/me", methods=["GET"])
    def me():
        user = get_current_user()
        if not user:
            return jsonify({"authenticated": False, "user": None})
        return jsonify({"authenticated": True, "user": serialize_user(user)})

    @bp.route("/api/me/profile", methods=["PATCH"])
    def patch_profile():
        user = get_current_user()
        if not user:
            return jsonify({"error": "请先登录"}), 401

        payload = request.json or {}
        update_error = update_profile(user, payload)
        if update_error:
            error_payload, status = update_error
            return jsonify(error_payload), status
        return jsonify({"ok": True, "user": serialize_user(user)})

    return bp
