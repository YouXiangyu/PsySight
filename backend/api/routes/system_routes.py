from flask import Blueprint, current_app, jsonify

from application.services.system_service import build_availability_payload, build_health_payload


def create_system_blueprint(api_metrics, app_started_at):
    bp = Blueprint("system_routes", __name__)

    @bp.route("/api/health", methods=["GET"])
    def health_check():
        payload = build_health_payload(current_app.config["DEEPSEEK_MODEL"], app_started_at)
        return jsonify(payload)

    @bp.route("/api/metrics/availability", methods=["GET"])
    def availability_metrics():
        return jsonify(build_availability_payload(api_metrics))

    return bp
