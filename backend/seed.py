import os
import json
from flask import Flask
from models import db, Scale
from config import Config


CATEGORY_MAP = {
    "phq9": "情绪",
    "gad7": "情绪",
    "ais": "睡眠",
    "psqi": "睡眠",
    "mbti_short": "人格",
    "bigfive": "人格",
    "neoffi": "人格",
    "enneagram": "人格",
    "disc": "人格",
    "scl90": "综合",
    "k10": "综合",
    "dass21": "综合",
    "upi": "综合",
}


def infer_category(code: str) -> str:
    return CATEGORY_MAP.get(code, "综合")


def estimate_minutes(questions: list) -> int:
    count = len(questions or [])
    if count <= 10:
        return 5
    if count <= 30:
        return 8
    if count <= 60:
        return 12
    return 18


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    return app

def seed_data():
    app = create_app()
    with app.app_context():
        # 创建数据库表
        db.create_all()
        
        # 定义量表数据目录
        scales_dir = os.path.join(os.path.dirname(__file__), 'data', 'scales')
        if not os.path.exists(scales_dir):
            print(f"Warning: Directory {scales_dir} does not exist.")
            return

        added_count = 0
        updated_count = 0

        # 按文件名排序，避免导入顺序波动
        for filename in sorted(os.listdir(scales_dir)):
            if filename.endswith('.json'):
                file_path = os.path.join(scales_dir, filename)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        scale_data = json.load(f)
                        
                    title = scale_data.get('title')
                    if not title:
                        print(f"Skip {filename}: No title found.")
                        continue

                    code = os.path.splitext(filename)[0].lower()
                    questions = scale_data.get('questions') or []

                    # 优先按 code 找，兼容旧数据再按 title 找
                    existing_scale = Scale.query.filter_by(code=code).first()
                    if not existing_scale:
                        existing_scale = Scale.query.filter_by(title=title).first()
                    
                    if existing_scale:
                        # 如果已存在，更新内容
                        existing_scale.code = code
                        existing_scale.description = scale_data.get('description')
                        existing_scale.category = infer_category(code)
                        existing_scale.estimated_minutes = estimate_minutes(questions)
                        existing_scale.questions = questions
                        existing_scale.scoring_rules = scale_data.get('scoring_rules')
                        updated_count += 1
                    else:
                        new_scale = Scale(
                            code=code,
                            title=title,
                            category=infer_category(code),
                            estimated_minutes=estimate_minutes(questions),
                            description=scale_data.get('description'),
                            questions=questions,
                            scoring_rules=scale_data.get('scoring_rules')
                        )
                        db.session.add(new_scale)
                        added_count += 1
                except Exception as e:
                    print(f"Error loading {filename}: {str(e)}")

        db.session.commit()
        
        print(f"Seed process completed!")
        print(f"Added: {added_count} new scales.")
        print(f"Updated: {updated_count} existing scales.")
        
        # 打印数据库位置
        db_path = app.config.get('SQLALCHEMY_DATABASE_URI', '').replace('sqlite:///', '')
        print(f"Database Location: {os.path.abspath(db_path) if 'sqlite' in str(app.config.get('SQLALCHEMY_DATABASE_URI')) else 'Remote DB'}")

if __name__ == '__main__':
    seed_data()
