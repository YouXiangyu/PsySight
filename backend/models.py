from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="user")
    gender = db.Column(db.String(20))
    age = db.Column(db.Integer)
    region = db.Column(db.String(60))
    show_nickname_in_stats = db.Column(db.Boolean, default=False)
    profile_updated_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login_at = db.Column(db.DateTime)

class Scale(db.Model):
    __tablename__ = 'scales'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)  # 例如 "phq9"
    title = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), default="综合")
    estimated_minutes = db.Column(db.Integer, default=5)
    description = db.Column(db.Text)
    questions = db.Column(db.JSON, nullable=False)
    scoring_rules = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ConversationSession(db.Model):
    __tablename__ = 'conversation_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    title = db.Column(db.String(120), nullable=False, default="新对话")
    is_anonymous = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ConversationMessage(db.Model):
    __tablename__ = 'conversation_messages'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('conversation_sessions.id'), nullable=False, index=True)
    role = db.Column(db.String(20), nullable=False)  # user / assistant
    content = db.Column(db.Text, nullable=False)
    recommended_scale_code = db.Column(db.String(50))
    recommended_scale_title = db.Column(db.String(100))
    crisis_flag = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class MessageFeedback(db.Model):
    __tablename__ = 'message_feedbacks'
    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.Integer, db.ForeignKey('conversation_messages.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    feedback = db.Column(db.String(10), nullable=False)  # up / down
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AssessmentRecord(db.Model):
    __tablename__ = 'assessment_records'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    scale_id = db.Column(db.Integer, db.ForeignKey('scales.id'))
    total_score = db.Column(db.Integer)
    severity_level = db.Column(db.String(30))
    user_answers = db.Column(db.JSON)
    emotion_log = db.Column(db.JSON)
    emotion_consent = db.Column(db.Boolean, default=False)
    hidden_from_stats = db.Column(db.Boolean, default=False)
    ai_report = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class CrisisEvent(db.Model):
    __tablename__ = 'crisis_events'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    session_id = db.Column(db.Integer, db.ForeignKey('conversation_sessions.id'))
    trigger_text = db.Column(db.Text, nullable=False)
    matched_keywords = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class UserProfile(db.Model):
    __tablename__ = 'user_profiles'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False, index=True)
    persona = db.Column(db.Text)
    communication_style = db.Column(db.String(30))
    core_concerns = db.Column(db.JSON)
    history_summary = db.Column(db.Text)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ExportAudit(db.Model):
    __tablename__ = 'export_audits'
    id = db.Column(db.Integer, primary_key=True)
    export_format = db.Column(db.String(10), nullable=False)  # json/csv
    record_count = db.Column(db.Integer, nullable=False, default=0)
    source_ip = db.Column(db.String(64))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
