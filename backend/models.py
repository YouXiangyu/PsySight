from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    # 课程项目使用简单哈希存储
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Scale(db.Model):
    __tablename__ = 'scales'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False) # 例如 "PHQ-9"
    description = db.Column(db.Text)
    # 存储题目为 JSON 结构
    # 结构示例: [{"id": 1, "text": "...", "options": [{"label": "是", "score": 1}]}]
    questions = db.Column(db.JSON, nullable=False)
    scoring_rules = db.Column(db.Text) # AI 分析时的评分上下文

class AssessmentRecord(db.Model):
    __tablename__ = 'assessment_records'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    scale_id = db.Column(db.Integer, db.ForeignKey('scales.id'))
    total_score = db.Column(db.Integer)
    # JSON 存储用户的具体选项: {"q1": 1, "q2": 3}
    user_answers = db.Column(db.JSON)
    # JSON 存储情绪统计: {"happy": 0.1, "sad": 0.8, "neutral": 0.1}
    emotion_log = db.Column(db.JSON) 
    # 由 Gemini 生成的最终 Markdown 报告
    ai_report = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
