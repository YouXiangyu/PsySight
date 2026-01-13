import os
from flask import Flask
from models import db
from config import Config
import json

def create_app():
    app = Flask(__name__)
    # 统一使用 config.py 中的配置
    app.config.from_object(Config)
    
    db.init_app(app)
    return app

def seed_data():
    app = create_app()
    with app.app_context():
        # 创建表 (这会在 backend 目录下生成 psysight.db 文件)
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
                {"id": 4, "text": "感到疲倦或没有精力", "options": [{"label": "完全没有", "score": 0}, {"label": "有几天", "score": 1}, {"label": "一半以上的天数", "score": 2}, {"label": "几乎天天", "score": 3}]},
                {"id": 5, "text": "胃口不好或吃得太多", "options": [{"label": "完全没有", "score": 0}, {"label": "有几天", "score": 1}, {"label": "一半以上的天数", "score": 2}, {"label": "几乎天天", "score": 3}]},
                {"id": 6, "text": "觉得自己很糟——或觉得自己很失败，或让自己、家人失望", "options": [{"label": "完全没有", "score": 0}, {"label": "有几天", "score": 1}, {"label": "一半以上的天数", "score": 2}, {"label": "几乎天天", "score": 3}]},
                {"id": 7, "text": "对事物专注有困难，例如看报纸或看电视时", "options": [{"label": "完全没有", "score": 0}, {"label": "有几天", "score": 1}, {"label": "一半以上的天数", "score": 2}, {"label": "几乎天天", "score": 3}]},
                {"id": 8, "text": "动作或说话速度缓慢到别人已经察觉？或正好相反——烦躁或坐立不安、动来动去的情况远比平常多", "options": [{"label": "完全没有", "score": 0}, {"label": "有几天", "score": 1}, {"label": "一半以上的天数", "score": 2}, {"label": "几乎天天", "score": 3}]},
                {"id": 9, "text": "有不如死掉或用某种方式伤害自己的念头", "options": [{"label": "完全没有", "score": 0}, {"label": "有几天", "score": 1}, {"label": "一半以上的天数", "score": 2}, {"label": "几乎天天", "score": 3}]},
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
                {"id": 3, "text": "对各种各样的事情忧虑太多", "options": [{"label": "完全没有", "score": 0}, {"label": "有几天", "score": 1}, {"label": "一半以上的天数", "score": 2}, {"label": "几乎天天", "score": 3}]},
                {"id": 4, "text": "很难放松下来", "options": [{"label": "完全没有", "score": 0}, {"label": "有几天", "score": 1}, {"label": "一半以上的天数", "score": 2}, {"label": "几乎天天", "score": 3}]},
                {"id": 5, "text": "由于不安而无法静坐", "options": [{"label": "完全没有", "score": 0}, {"label": "有几天", "score": 1}, {"label": "一半以上的天数", "score": 2}, {"label": "几乎天天", "score": 3}]},
                {"id": 6, "text": "变得容易烦躁或急躁", "options": [{"label": "完全没有", "score": 0}, {"label": "有几天", "score": 1}, {"label": "一半以上的天数", "score": 2}, {"label": "几乎天天", "score": 3}]},
                {"id": 7, "text": "感到害怕，就像有什么可怕的事会发生", "options": [{"label": "完全没有", "score": 0}, {"label": "有几天", "score": 1}, {"label": "一半以上的天数", "score": 2}, {"label": "几乎天天", "score": 3}]},
            ],
            scoring_rules="0-4: 无焦虑; 5-9: 轻度焦虑; 10-14: 中度焦虑; 15-21: 重度焦虑。"
        )

        # 3. AIS 阿森斯失眠量表
        ais = Scale(
            title="AIS 阿森斯失眠量表",
            description="请评价在过去的一个月内，如果您每星期至少出现3次下述情况，请选择最符合您情况的选项。",
            questions=[
                {"id": 1, "text": "入睡时间（关灯后至入睡所需的时间）", "options": [{"label": "没问题", "score": 0}, {"label": "稍微延迟", "score": 1}, {"label": "显著延迟", "score": 2}, {"label": "延迟或没睡着", "score": 3}]},
                {"id": 2, "text": "夜间苏醒", "options": [{"label": "没问题", "score": 0}, {"label": "轻微影响", "score": 1}, {"label": "显著影响", "score": 2}, {"label": "严重影响或没睡着", "score": 3}]},
                {"id": 3, "text": "比期望的时间早醒", "options": [{"label": "没问题", "score": 0}, {"label": "轻微提早", "score": 1}, {"label": "显著提早", "score": 2}, {"label": "严重提早或没睡着", "score": 3}]},
                {"id": 4, "text": "总睡眠时间", "options": [{"label": "足够", "score": 0}, {"label": "轻微不足", "score": 1}, {"label": "显著不足", "score": 2}, {"label": "严重不足或没睡着", "score": 3}]},
                {"id": 5, "text": "总睡眠质量（无论睡了多久）", "options": [{"label": "满意", "score": 0}, {"label": "轻微不满", "score": 1}, {"label": "显著不满", "score": 2}, {"label": "极度不满", "score": 3}]},
                {"id": 6, "text": "白天情绪", "options": [{"label": "正常", "score": 0}, {"label": "轻微低落", "score": 1}, {"label": "显著低落", "score": 2}, {"label": "严重低落", "score": 3}]},
                {"id": 7, "text": "白天身体功能（体力和脑力）", "options": [{"label": "正常", "score": 0}, {"label": "轻微影响", "score": 1}, {"label": "显著影响", "score": 2}, {"label": "严重影响", "score": 3}]},
                {"id": 8, "text": "白天嗜睡程度", "options": [{"label": "无嗜睡", "score": 0}, {"label": "轻微嗜睡", "score": 1}, {"label": "显著嗜睡", "score": 2}, {"label": "严重嗜睡", "score": 3}]},
            ],
            scoring_rules="总分 < 4: 无失眠障碍; 4-6: 可疑失眠; > 6: 失眠。"
        )

        # 检查是否已存在，不存在则添加
        if not Scale.query.filter_by(title="PHQ-9 抑郁症筛查量表").first():
            db.session.add(phq9)
        if not Scale.query.filter_by(title="GAD-7 焦虑症筛查量表").first():
            db.session.add(gad7)
        if not Scale.query.filter_by(title="AIS 阿森斯失眠量表").first():
            db.session.add(ais)
            
        db.session.commit()
        
        # 打印数据库位置
        db_path = app.config.get('SQLALCHEMY_DATABASE_URI', '').replace('sqlite:///', '')
        import os
        print(f"Success: Database (SQLite) initialized and seeded!")
        print(f"Location: {os.path.abspath(db_path) if 'sqlite' in str(app.config.get('SQLALCHEMY_DATABASE_URI')) else 'Remote DB'}")

if __name__ == '__main__':
    seed_data()
