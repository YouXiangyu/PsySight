from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, User, Scale, AssessmentRecord
from config import Config
import json
import requests
import base64
import io
import os

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

db.init_app(app)

# ========== 小米 Mimo API 配置 (Anthropic 兼容协议) ==========
MIMO_API_KEY = "sk-crryec67twraqwq7fg0qej82o25yqaozitpt4xng47qk75qb"
MIMO_BASE_URL = "https://api.xiaomimimo.com/anthropic/v1/messages"

def call_mimo_ai(system_prompt: str, user_message: str) -> str:
    """
    调用小米 Mimo API (Anthropic Messages 格式)
    """
    headers = {
        "x-api-key": MIMO_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }
    
    payload = {
        "model": "mimo-v2-flash",
        "max_tokens": 2048,
        "system": system_prompt,
        "messages": [
            {"role": "user", "content": user_message}
        ]
    }

    try:
        print(f"📡 正在请求 Mimo AI...")
        response = requests.post(MIMO_BASE_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        
        result = response.json()
        # Anthropic 响应格式: {"content": [{"type": "text", "text": "..."}]}
        content = result['content'][0]['text']
        print(f"🤖 Mimo 响应成功 (长度: {len(content)} 字符)")
        return content
    except requests.exceptions.RequestException as e:
        print(f"❌ Mimo API 请求错误: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   错误详情: {e.response.text}")
        raise e
    except (KeyError, IndexError) as e:
        print(f"❌ Mimo API 响应解析错误: {str(e)}")
        print(f"   原始响应: {response.text}")
        raise e

# ========== 系统提示词 ==========
TRIAGE_SYSTEM_PROMPT = """你是一个名为 PsySight 的心理健康助手。
你的目标是：
1. 以温暖、共情的语气与用户交流。
2. 听取他们的困扰（如失眠、焦虑、抑郁等）。
3. 如果用户描述的情况匹配以下量表，请**务必**推荐该量表：
   - PHQ-9 抑郁症筛查量表 (ID: 1) - 适用于情绪低落、没兴趣、疲倦、想不开等。
   - GAD-7 焦虑症筛查量表 (ID: 2) - 适用于紧张、担忧、无法放松、惊恐等。
   - AIS 阿森斯失眠量表 (ID: 3) - 适用于入睡困难、早醒、睡眠质量差、白天没精神等睡眠问题。

你的回复必须是一个纯 JSON 对象（不要包含 markdown 代码块标记），格式如下：
{"reply": "你对用户的安慰和回复", "recommended_scale_id": 1或2或3或null, "recommended_scale_title": "量表名称"或null}

注意：如果用户提到睡眠不好、睡不着，请务必推荐 ID 为 3 的 AIS 量表，不要说“没有特定量表”。"""

REPORT_SYSTEM_PROMPT = """你是一个专业的心理健康助手。请根据用户提供的测评数据生成一份温暖、专业的心理支持报告。

要求：
1. 语气温暖、鼓励、专业
2. 必须在报告开头包含免责声明：「⚠️ 本报告仅供参考，不构成医疗诊断或专业心理治疗建议。」
3. 解释得分的含义
4. 结合用户测试时的情绪状态给出生活建议（如睡眠、运动、社交、冥想等）
5. 使用 Markdown 格式美化输出"""

# ========== API 路由 ==========

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    
    print(f"📩 收到用户消息: {user_message}")
    
    try:
        ai_response = call_mimo_ai(TRIAGE_SYSTEM_PROMPT, user_message)
        
        # 清理可能存在的 Markdown 代码块标记
        json_str = ai_response.strip()
        if json_str.startswith('```json'):
            json_str = json_str[7:]
        if json_str.startswith('```'):
            json_str = json_str[3:]
        if json_str.endswith('```'):
            json_str = json_str[:-3]
        json_str = json_str.strip()
        
        result = json.loads(json_str)
        return jsonify(result)
    except json.JSONDecodeError as e:
        print(f"❌ JSON 解析失败: {str(e)}")
        print(f"   原始内容: {ai_response}")
        # 如果 JSON 解析失败，返回原始文本作为回复
        return jsonify({
            "reply": ai_response,
            "recommended_scale_id": None,
            "recommended_scale_title": None
        })
    except Exception as e:
        print(f"❌ 聊天接口错误: {str(e)}")
        return jsonify({
            "reply": "抱歉，AI 服务暂时连接不畅，请稍后再试。",
            "recommended_scale_id": None,
            "recommended_scale_title": None,
            "error": str(e)
        }), 500

@app.route('/api/submit', methods=['POST'])
def submit():
    data = request.json
    user_id = data.get('user_id', 1)
    scale_id = data.get('scale_id')
    answers = data.get('answers', {})
    emotion_log = data.get('emotion_log', {})

    total_score = sum(answers.values())
    print(f"📝 收到测评提交: Scale {scale_id}, Score {total_score}")

    try:
        scale = Scale.query.get_or_404(scale_id)
        dominant_emotion = max(emotion_log, key=emotion_log.get) if emotion_log else "neutral"
        emotion_weight = emotion_log.get(dominant_emotion, 0) if emotion_log else 0

        user_data = f"""
测评量表：{scale.title}
用户得分：{total_score} 分
评分标准：{scale.scoring_rules}
测试期间主导情绪：{dominant_emotion} (置信度: {emotion_weight:.2%})
"""
        
        ai_report = call_mimo_ai(REPORT_SYSTEM_PROMPT, user_data)
        
        record = AssessmentRecord(
            user_id=user_id,
            scale_id=scale_id,
            total_score=total_score,
            user_answers=answers,
            emotion_log=emotion_log,
            ai_report=ai_report
        )
        db.session.add(record)
        db.session.commit()
        
        print(f"✅ 报告生成成功，记录 ID: {record.id}")
        
        return jsonify({
            "record_id": record.id,
            "total_score": total_score,
            "ai_report": ai_report
        })
    except Exception as e:
        print(f"❌ 生成报告错误: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/canvas/analyze', methods=['POST'])
def analyze_canvas():
    """
    绘画分析接口 - 暂时禁用（等待支持视觉的模型）
    """
    print("🎨 收到绘画分析请求 (功能暂未启用)")
    return jsonify({
        "analysis": """## 🚧 功能暂未启用

抱歉，绘画分析功能目前尚未配置支持视觉理解的 AI 模型。

您可以：
1. 等待管理员配置支持 Vision 的模型
2. 先体验其他功能（AI 聊天、心理量表测评）

---
*此消息为系统自动生成*"""
    })

@app.route('/api/report/<int:record_id>', methods=['GET'])
def get_report(record_id):
    record = AssessmentRecord.query.get_or_404(record_id)
    return jsonify({
        "id": record.id,
        "total_score": record.total_score,
        "ai_report": record.ai_report,
        "emotion_log": record.emotion_log,
        "created_at": record.created_at.isoformat()
    })

@app.route('/api/scales/<int:scale_id>', methods=['GET'])
def get_scale(scale_id):
    scale = Scale.query.get_or_404(scale_id)
    return jsonify({
        "id": scale.id,
        "title": scale.title,
        "description": scale.description,
        "questions": scale.questions
    })

# ========== 启动服务 ==========
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    print("🚀 PsySight 后端启动中...")
    print("   AI 模型: 小米 Mimo v2 Flash (Anthropic 兼容)")
    print("   端口: 5000")
    app.run(debug=True, port=5000)
