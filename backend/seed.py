import os
import json
from flask import Flask
from models import db, Scale
from config import Config

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

        # 遍历目录下的所有 JSON 文件
        for filename in os.listdir(scales_dir):
            if filename.endswith('.json'):
                file_path = os.path.join(scales_dir, filename)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        scale_data = json.load(f)
                        
                    title = scale_data.get('title')
                    if not title:
                        print(f"Skip {filename}: No title found.")
                        continue

                    # 检查量表是否已存在
                    existing_scale = Scale.query.filter_by(title=title).first()
                    
                    if existing_scale:
                        # 如果已存在，更新内容（可选）
                        existing_scale.description = scale_data.get('description')
                        existing_scale.questions = scale_data.get('questions')
                        existing_scale.scoring_rules = scale_data.get('scoring_rules')
                        updated_count += 1
                    else:
                        # 如果不存在，创建新记录
                        new_scale = Scale(
                            title=title,
                            description=scale_data.get('description'),
                            questions=scale_data.get('questions'),
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
