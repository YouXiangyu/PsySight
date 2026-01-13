import os
from flask import Flask
from models import db
import json

def create_app():
    app = Flask(__name__)
    # 数据库连接配置 (MySQL)
    # 请确保您已经创建了名为 'psysight' 的数据库
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'mysql+pymysql://root:password@localhost/psysight')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    return app

def seed_data():
    app = create_app()
    with app.app_context():
        # 创建表
        db.create_all()
        
        from models import Scale
        
        # 1. PHQ-9 抑郁症筛查量表
        phq9 = Scale(
            title="PHQ-9 抑郁症筛查量表",
            description="过去两周内，您有多少时间受到以下问题的困扰？",
            questions=[
                {"id": 1, "text": "做事提不起劲，或没有乐趣", "options": [{"label": "完全没有", "score": 0}, {"label": "有几天", "score": 1}, {"label": "一半以上的天数", "score": 2}, {"label": "几乎天天", "score": 3}]},
                {"id": 2, "text": "感到心情低落、沮丧或绝望", "options": [{"label": "完全没有", "score": 0}, {"label": "有几天", "score": 1}, {"label": "一半以上的天数", "score": 2}, {"label": "几乎天天", "score": 3}]},
                {"id": 3, "text": "入睡困难、睡得不稳或睡得太多", "options": [{"label": "完全没有", "score": 0}, {"label": "有几天", "score": 1}, {"label": "一半以上的天数", "score": 2}, {"label": "几乎天天", "score": 3}]},
                # ... 为简洁起见，这里省略其他题目，实际项目中应补全
            ],
            scoring_rules="0-4: 无抑郁; 5-9: 轻度; 10-14: 中度; 15-19: 中重度; 20-27: 重度。"
        )

        # 2. GAD-7 焦虑症筛查量表
        gad7 = Scale(
            title="GAD-7 焦虑症筛查量表",
            description="过去两周内，您有多少时间受到以下问题的困扰？",
            questions=[
                {"id": 1, "text": "感到紧张、焦虑或急躁", "options": [{"label": "完全没有", "score": 0}, {"label": "有几天", "score": 1}, {"label": "一半以上的天数", "score": 2}, {"label": "几乎天天", "score": 3}]},
                {"id": 2, "text": "无法停止或控制忧虑", "options": [{"label": "完全没有", "score": 0}, {"label": "有几天", "score": 1}, {"label": "一半以上的天数", "score": 2}, {"label": "几乎天天", "score": 3}]},
            ],
            scoring_rules="0-4: 无焦虑; 5-9: 轻度焦虑; 10-14: 中度焦虑; 15-21: 重度焦虑。"
        )

        # 检查是否已存在，不存在则添加
        if not Scale.query.filter_by(title="PHQ-9 抑郁症筛查量表").first():
            db.session.add(phq9)
        if not Scale.query.filter_by(title="GAD-7 焦虑症筛查量表").first():
            db.session.add(gad7)
            
        db.session.commit()
        print("数据库初始化并填充成功！")

if __name__ == '__main__':
    seed_data()
