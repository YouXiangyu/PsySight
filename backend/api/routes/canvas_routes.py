from flask import Blueprint, current_app, jsonify, request

from application.services.canvas_service import analyze_canvas


def create_canvas_blueprint():
    bp = Blueprint("canvas_routes", __name__)

    @bp.route("/api/canvas/analyze", methods=["POST"])
    def analyze_canvas_api():
        payload, status = analyze_canvas(request.json or {}, current_app.config)
        return jsonify(payload), status

    return bp
