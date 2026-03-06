from flask import Blueprint, current_app, jsonify, request

from application.services.assessment_service import (
    get_report,
    list_my_reports,
    set_report_stats_visibility,
    submit_assessment,
)
from application.services.context_service import get_current_user


def create_report_blueprint():
    bp = Blueprint("report_routes", __name__)

    @bp.route("/api/submit", methods=["POST"])
    def submit_assessment_api():
        user = get_current_user()
        payload, status = submit_assessment(request.json or {}, user, current_app.config)
        return jsonify(payload), status

    @bp.route("/api/report/<int:record_id>", methods=["GET"])
    def get_report_api(record_id: int):
        current_user = get_current_user()
        payload, status = get_report(record_id, current_user)
        return jsonify(payload), status

    @bp.route("/api/reports/me", methods=["GET"])
    def my_reports_api():
        user = get_current_user()
        if not user:
            return jsonify({"error": "请先登录"}), 401

        limit = min(max(int(request.args.get("limit", 50)), 1), 100)
        offset = max(int(request.args.get("offset", 0)), 0)
        return jsonify(list_my_reports(user, limit, offset))

    @bp.route("/api/reports/<int:record_id>/stats-visibility", methods=["PATCH"])
    def set_report_stats_visibility_api(record_id: int):
        user = get_current_user()
        if not user:
            return jsonify({"error": "请先登录"}), 401

        data = request.json or {}
        hidden = data.get("hidden_from_stats")
        if not isinstance(hidden, bool):
            return jsonify({"error": "hidden_from_stats 必须是布尔值"}), 400

        payload, status = set_report_stats_visibility(record_id, user, hidden)
        return jsonify(payload), status

    return bp
