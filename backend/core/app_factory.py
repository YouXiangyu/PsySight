import time

from flask import Flask, g, request
from flask_cors import CORS

from api.routes.auth_routes import create_auth_blueprint
from api.routes.canvas_routes import create_canvas_blueprint
from api.routes.chat_routes import create_chat_blueprint
from api.routes.conversation_routes import create_conversation_blueprint
from api.routes.report_routes import create_report_blueprint
from api.routes.safety_routes import create_safety_blueprint
from api.routes.scale_routes import create_scale_blueprint
from api.routes.internal_routes import create_internal_blueprint
from api.routes.stats_admin_routes import create_stats_admin_blueprint
from api.routes.system_routes import create_system_blueprint
from config import Config
from models import db


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    app.secret_key = app.config["SECRET_KEY"]
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SECURE"] = False

    CORS(
        app,
        resources={r"/api/*": {"origins": [app.config["FRONTEND_ORIGIN"], "http://localhost:8003", "http://127.0.0.1:8003"]}},
        supports_credentials=True,
    )

    db.init_app(app)

    app_started_at = time.time()
    api_metrics = {"total": 0, "errors": 0}
    app.extensions["api_metrics"] = api_metrics
    app.extensions["app_started_at"] = app_started_at

    @app.before_request
    def on_request_start():
        g.request_start_at = time.time()

    @app.after_request
    def on_request_end(response):
        if request.path.startswith("/api/"):
            api_metrics["total"] += 1
            if response.status_code >= 400:
                api_metrics["errors"] += 1
            elapsed_ms = int((time.time() - getattr(g, "request_start_at", time.time())) * 1000)
            print(f"API {request.method} {request.path} -> {response.status_code} ({elapsed_ms}ms)")
        return response

    app.register_blueprint(create_system_blueprint(api_metrics, app_started_at))
    app.register_blueprint(create_safety_blueprint())
    app.register_blueprint(create_scale_blueprint())
    app.register_blueprint(create_auth_blueprint())
    app.register_blueprint(create_conversation_blueprint())
    app.register_blueprint(create_chat_blueprint())
    app.register_blueprint(create_report_blueprint())
    app.register_blueprint(create_canvas_blueprint())
    app.register_blueprint(create_stats_admin_blueprint())
    app.register_blueprint(create_internal_blueprint())

    return app
