from flask import Blueprint, jsonify, request

from application.services.scale_service import (
    get_scale_by_code_payload,
    get_scale_by_id_payload,
    list_scales_payload,
    recommend_scale_payload,
)


def create_scale_blueprint():
    bp = Blueprint("scale_routes", __name__)

    @bp.route("/api/scales", methods=["GET"])
    def list_scales():
        grouped = request.args.get("grouped") == "1"
        return jsonify(list_scales_payload(grouped))

    @bp.route("/api/scales/recommend", methods=["POST"])
    def recommend_scale():
        data = request.json or {}
        text_content = (data.get("text") or "").strip()
        return jsonify(recommend_scale_payload(text_content))

    @bp.route("/api/scales/code/<string:scale_code>", methods=["GET"])
    def get_scale_by_code_api(scale_code: str):
        payload = get_scale_by_code_payload(scale_code)
        if not payload:
            return jsonify({"error": "量表不存在"}), 404
        return jsonify(payload)

    @bp.route("/api/scales/<int:scale_id>", methods=["GET"])
    def get_scale(scale_id: int):
        payload = get_scale_by_id_payload(scale_id)
        if not payload:
            return jsonify({"error": "量表不存在"}), 404
        return jsonify(payload)

    return bp
