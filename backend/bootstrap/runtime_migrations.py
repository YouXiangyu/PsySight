from sqlalchemy import inspect, text

from models import Scale, db


def run_lightweight_migrations() -> None:
    inspector = inspect(db.engine)
    with db.engine.begin() as conn:
        if "users" in inspector.get_table_names():
            cols = {c["name"] for c in inspector.get_columns("users")}
            if "email" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR(120)"))
            if "role" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'"))
            if "last_login_at" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN last_login_at DATETIME"))
            if "gender" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN gender VARCHAR(20)"))
            if "age" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN age INTEGER"))
            if "region" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN region VARCHAR(60)"))
            if "show_nickname_in_stats" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN show_nickname_in_stats BOOLEAN DEFAULT 0"))
            if "profile_updated_at" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN profile_updated_at DATETIME"))
        if "scales" in inspector.get_table_names():
            cols = {c["name"] for c in inspector.get_columns("scales")}
            if "code" not in cols:
                conn.execute(text("ALTER TABLE scales ADD COLUMN code VARCHAR(50)"))
            if "category" not in cols:
                conn.execute(text("ALTER TABLE scales ADD COLUMN category VARCHAR(50) DEFAULT '综合'"))
            if "estimated_minutes" not in cols:
                conn.execute(text("ALTER TABLE scales ADD COLUMN estimated_minutes INTEGER DEFAULT 5"))
            if "created_at" not in cols:
                conn.execute(text("ALTER TABLE scales ADD COLUMN created_at DATETIME"))
            if "updated_at" not in cols:
                conn.execute(text("ALTER TABLE scales ADD COLUMN updated_at DATETIME"))
        if "assessment_records" in inspector.get_table_names():
            cols = {c["name"] for c in inspector.get_columns("assessment_records")}
            if "severity_level" not in cols:
                conn.execute(text("ALTER TABLE assessment_records ADD COLUMN severity_level VARCHAR(30)"))
            if "emotion_consent" not in cols:
                conn.execute(text("ALTER TABLE assessment_records ADD COLUMN emotion_consent BOOLEAN DEFAULT 0"))
            if "hidden_from_stats" not in cols:
                conn.execute(text("ALTER TABLE assessment_records ADD COLUMN hidden_from_stats BOOLEAN DEFAULT 0"))

            indexes = {idx["name"] for idx in inspector.get_indexes("assessment_records")}
            if "idx_assessment_records_user_created" not in indexes:
                conn.execute(
                    text(
                        "CREATE INDEX idx_assessment_records_user_created "
                        "ON assessment_records (user_id, created_at)"
                    )
                )


def bootstrap_scale_codes() -> None:
    alias_map = {
        "PHQ-9 抑郁症筛查量表": "phq9",
        "GAD-7 焦虑症筛查量表": "gad7",
        "AIS 阿森斯失眠量表": "ais",
    }
    scales = Scale.query.all()
    changed = False
    for scale in scales:
        if not scale.code:
            scale.code = alias_map.get(scale.title, f"scale_{scale.id}")
            changed = True
        if not scale.category:
            scale.category = "综合"
            changed = True
        if not scale.estimated_minutes:
            question_count = len(scale.questions or [])
            scale.estimated_minutes = 5 if question_count <= 10 else 8
            changed = True
    if changed:
        db.session.commit()
