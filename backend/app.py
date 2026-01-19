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

# ========== AI 接口配置 ==========
def call_ai(system_prompt: str, user_message: str) -> str:
    """
    统一 AI 调用入口，目前默认使用 DeepSeek V3
    """
    return call_deepseek_ai(system_prompt, user_message)

def call_deepseek_ai(system_prompt: str, user_message: str) -> str:
    """
    调用 DeepSeek API (OpenAI 兼容协议)
    """
    headers = {
        "Authorization": f"Bearer {app.config['DEEPSEEK_API_KEY']}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": app.config['DEEPSEEK_MODEL'],
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.7,
        "max_tokens": 2048
    }

    try:
        print(f"📡 正在请求 DeepSeek AI ({app.config['DEEPSEEK_MODEL']})...")
        url = f"{app.config['DEEPSEEK_BASE_URL']}/chat/completions"
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        
        result = response.json()
        content = result['choices'][0]['message']['content']
        print(f"🤖 DeepSeek 响应成功 (长度: {len(content)} 字符)")
        return content
    except Exception as e:
        print(f"❌ DeepSeek API 请求错误: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   错误详情: {e.response.text}")
        # 如果 DeepSeek 出错，尝试备选模型 Mimo (可选)
        # return call_mimo_ai(system_prompt, user_message)
        raise e

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
TRIAGE_SYSTEM_PROMPT = """你是一个名为 PsySight 的专业心理健康助手。
你拥有一个包含 46 个专业量表的库，你的目标是：
1. 以温暖、共情、非评判的语气与用户交流，让他们感到被听见和被理解。
2. 敏锐捕捉用户描述中的关键词（如：失眠、社交恐惧、工作压力、性格迷茫、童年阴影等）。
3. 必须从以下量表库中选择最匹配的一个推荐给用户：

[情绪与压力类]
- PHQ-9 抑郁症筛查 (ID: 1): 适用于情绪低落、兴趣丧失、疲劳感。
- GAD-7 焦虑症筛查 (ID: 2): 适用于过度担忧、紧张不安、无法放松。
- DASS-21 情绪自评 (ID: 18): 综合评估抑郁、焦虑和压力水平。
- SCL-90 症状自评 (ID: 39): 综合性的心理健康体检，涵盖强迫、偏执等 9 个维度。
- PSS-10 压力感知 (ID: 8): 评估近期生活压力的承受程度。

[睡眠障碍类]
- AIS 阿森斯失眠量表 (ID: 3): 快速判断失眠程度。
- PSQI 匹兹堡睡眠质量 (ID: 38): 更详细的睡眠习惯分析。

[人格与自我类]
- MBTI 人格测试 (ID: 6 或 31): 适合性格探索、职业规划。
- BigFive 大五人格 (ID: 14): 学术界最认可的人格模型。
- 九型人格 (ID: 21): 深度自我认知和动机分析。
- SES 尊严/自尊量表 (ID: 9): 评估自信心和自我价值感。

[人际与情感类]
- UCLA 孤独感量表 (ID: 44): 适用于感到孤独、无法融入集体的情况。
- ECR 亲密关系体验 (ID: 20): 评估恋爱/伴侣中的依恋风格（安全、焦虑、回避型）。
- SIAS 社交焦虑 (ID: 41): 适用于害怕社交、人群恐惧。
- PBI 父母养育方式 (ID: 36): 探索童年经历和原生家庭影响。

[特殊心理筛查]
- ASRS 成人 ADHD (ID: 11): 适用于注意力不集中、多动、拖延严重。
- Y-BOCS 强迫症量表 (ID: 46): 适用于反复检查、强迫思维。
- PCL-5 PTSD 筛查 (ID: 37): 适用于经历重大创伤后的应激反应。
- MDQ 双相情感障碍 (ID: 32): 评估情绪的高低起伏波动。

你的回复必须是一个纯 JSON 对象（不要包含 markdown 代码块标记），格式如下：
{"reply": "你对用户的安慰、共情和回复", "recommended_scale_id": 对应ID或null, "recommended_scale_title": "量表名称"或null}

注意：
- 即使推荐了量表，回复的 "reply" 部分也应保持人性化，不要像个机器人。
- 如果用户只是闲聊，没有明显困扰，可以推荐 MBTI (ID: 6) 作为趣味开始。
- 如果提到严重的自杀倾向，请在 reply 中加入危机干预提示。"""

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
        ai_response = call_ai(TRIAGE_SYSTEM_PROMPT, user_message)
        
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
        
        ai_report = call_ai(REPORT_SYSTEM_PROMPT, user_data)
        
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
    print(f"   AI 模型: DeepSeek V3 ({app.config.get('DEEPSEEK_MODEL')})")
    print("   端口: 8004")
    app.run(debug=True, port=8004, host='0.0.0.0', threaded=True)
