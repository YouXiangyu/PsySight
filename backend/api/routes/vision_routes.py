from flask import Blueprint, jsonify, request

from application.services.vision_service import analyze_emotion_payload


def create_vision_blueprint():
    bp = Blueprint("vision_routes", __name__)

    @bp.route("/api/vision/emotion/analyze", methods=["POST"])
    def analyze_emotion_api():
        payload, status = analyze_emotion_payload(request.json or {})
        return jsonify(payload), status

    return bp
