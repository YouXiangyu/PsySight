from bootstrap.runtime_migrations import bootstrap_scale_codes, run_lightweight_migrations
from bootstrap.startup_tasks import run_startup_tasks
from core.app_factory import create_app
from models import (
    AssessmentRecord,
    ConversationMessage,
    ConversationSession,
    CrisisEvent,
    ExportAudit,
    MessageFeedback,
    Scale,
    User,
    db,
)


app = create_app()

__all__ = [
    "app",
    "db",
    "User",
    "Scale",
    "ConversationSession",
    "ConversationMessage",
    "MessageFeedback",
    "AssessmentRecord",
    "CrisisEvent",
    "ExportAudit",
    "run_lightweight_migrations",
    "bootstrap_scale_codes",
]


if __name__ == "__main__":
    with app.app_context():
        run_startup_tasks()
    print("🚀 PsySight 后端启动中...")
    print(f"   AI 模型: {app.config['DEEPSEEK_MODEL']}")
    print("   端口: 8004")
    app.run(debug=True, port=8004, host="0.0.0.0", threaded=True)
