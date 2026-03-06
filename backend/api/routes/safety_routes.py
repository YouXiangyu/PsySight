from flask import Blueprint, jsonify

from application.services.safety_service import get_hotlines_payload


def create_safety_blueprint():
    bp = Blueprint("safety_routes", __name__)

    @bp.route("/api/safety/hotlines", methods=["GET"])
    def get_hotlines():
        return jsonify(get_hotlines_payload())

    return bp
