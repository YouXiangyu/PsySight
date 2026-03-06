from datetime import datetime
import csv
import io
import json
import re
import time
from typing import Dict, List, Optional

import requests
from flask import Flask, Response, g, jsonify, request, session
from flask_cors import CORS
from sqlalchemy import inspect, text, func
from werkzeug.security import check_password_hash, generate_password_hash

from config import Config
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

app = Flask(__name__)
app.config.from_object(Config)
app.secret_key = app.config["SECRET_KEY"]
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = False

CORS(
    app,
    resources={r"/api/*": {"origins": [app.config["FRONTEND_ORIGIN"], "http://localhost:8003", "http://127.0.0.1:8003"]}},
    supports_credentials=True,
)

db.init_app(app)
APP_STARTED_AT = time.time()
API_METRICS = {"total": 0, "errors": 0}

EMERGENCY_HOTLINES = [
    {"name": "全国心理援助热线", "phone": "400-161-9995"},
    {"name": "北京心理危机研究与干预中心", "phone": "010-82951332"},
    {"name": "生命热线", "phone": "400-821-1215"},
]

CRISIS_KEYWORDS = [
    "自杀",
    "自残",
    "不想活",
    "结束生命",
    "跳楼",
    "割腕",
    "轻生",
    "去死",
    "想死",
]

SCALE_KEYWORD_RULES = {
    "ais": ["失眠", "睡不着", "睡眠", "早醒", "入睡困难"],
    "gad7": ["焦虑", "紧张", "担忧", "害怕", "惊恐", "放松不下来"],
    "phq9": ["抑郁", "低落", "没兴趣", "绝望", "情绪不好", "心情差"],
}

SEVERITY_RULES = {
    "phq9": [(0, 4, "正常"), (5, 9, "轻度"), (10, 14, "中度"), (15, 19, "中重度"), (20, 27, "重度")],
    "gad7": [(0, 4, "正常"), (5, 9, "轻度"), (10, 14, "中度"), (15, 21, "重度")],
    "ais": [(0, 3, "无失眠"), (4, 6, "可疑失眠"), (7, 99, "失眠")],
}

SEVERITY_EXPLANATIONS = {
    "正常": "当前分值处于常见波动范围，可继续保持规律作息与情绪自我观察。",
    "轻度": "已出现一定程度困扰，建议尽早进行日常干预并持续观察变化。",
    "中度": "困扰对学习生活已有明显影响，建议结合专业咨询获取更系统支持。",
    "中重度": "困扰程度较高，建议尽快联系专业心理服务进行评估与干预。",
    "重度": "风险较高，建议优先联系专业机构并尽快获得面对面支持。",
    "无失眠": "睡眠状态整体尚可，可继续维持稳定作息。",
    "可疑失眠": "存在睡眠质量下降迹象，建议近期重点调整作息与睡前行为。",
    "失眠": "睡眠问题较明显，建议尽快进行专业评估并持续跟踪改善。",
    "待评估": "当前量表暂无标准分级映射，建议结合更多信息综合判断。",
}

ANON_ALIAS_PREFIXES = [
    "星辰",
    "微光",
    "溪流",
    "晴空",
    "晨曦",
    "远山",
    "青禾",
    "松风",
]

FALLBACK_REPLY_TEMPLATES = [
    "谢谢你愿意说出来。我注意到你提到“{snippet}”，这件事确实会让人很耗能。我们先从今天最难熬的那个时刻聊起，好吗？",
    "你把这些感受讲出来已经很不容易了，尤其是“{snippet}”这部分。若你愿意，我们可以先找一个今晚就能做到的小动作，帮你把状态拉回一点点。",
    "读到“{snippet}”我能感受到你在硬撑。你不是一个人，我们可以一步一步来。现在你更希望我先陪你梳理情绪，还是先给你一个具体的应对办法？",
]


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


def get_current_user() -> Optional[User]:
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)


def is_admin_authorized(req) -> bool:
    token = req.headers.get("X-Admin-Token", "")
    return bool(app.config["ADMIN_EXPORT_TOKEN"]) and token == app.config["ADMIN_EXPORT_TOKEN"]


def build_anonymous_alias(user_id: int) -> str:
    prefix = ANON_ALIAS_PREFIXES[user_id % len(ANON_ALIAS_PREFIXES)]
    suffix = (user_id * 37) % 100
    return f"{prefix}-{suffix:02d}"


def get_user_public_name(user: Optional[User]) -> str:
    if not user:
        return "匿名用户"
    if user.show_nickname_in_stats and user.username:
        return user.username
    return build_anonymous_alias(user.id)


def call_deepseek(system_prompt: str, user_prompt: str, max_tokens: int = 1200, temperature: float = 0.4) -> str:
    api_key = app.config["DEEPSEEK_API_KEY"]
    if not api_key:
        return ""

    url = f"{app.config['DEEPSEEK_BASE_URL'].rstrip('/')}/chat/completions"
    payload = {
        "model": app.config["DEEPSEEK_MODEL"],
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    start = time.time()
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=app.config["AI_TIMEOUT_SECONDS"])
        response.raise_for_status()
        body = response.json()
        content = body["choices"][0]["message"]["content"]
        elapsed = (time.time() - start) * 1000
        print(f"✅ DeepSeek 响应成功，耗时 {elapsed:.0f}ms")
        return content.strip()
    except Exception as exc:
        print(f"❌ DeepSeek 调用失败: {exc}")
        return ""


def extract_json(raw_text: str) -> Dict:
    if not raw_text:
        return {}
    cleaned = raw_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                return {}
    return {}


def detect_crisis_keywords(content: str) -> List[str]:
    return [keyword for keyword in CRISIS_KEYWORDS if keyword in content]


def recommend_scale_code_by_rules(content: str) -> Optional[str]:
    text = content.lower()
    for code, keywords in SCALE_KEYWORD_RULES.items():
        if any(keyword in text for keyword in keywords):
            return code
    return None


def get_scale_by_code(code: Optional[str]) -> Optional[Scale]:
    if not code:
        return None
    return Scale.query.filter(func.lower(Scale.code) == code.lower()).first()


def get_severity_level(scale_code: str, total_score: int) -> str:
    rules = SEVERITY_RULES.get(scale_code.lower())
    if rules:
        for low, high, label in rules:
            if low <= total_score <= high:
                return label
    return "待评估"


def get_urgent_recommendation(scale_code: str, total_score: int) -> Optional[str]:
    code = scale_code.lower()
    if code == "phq9" and total_score >= 20:
        return "建议尽快联系专业心理咨询师，并优先预约学校心理咨询中心。"
    if code == "gad7" and total_score >= 15:
        return "焦虑水平较高，建议尽快联系专业心理咨询师进行系统评估。"
    return None


def explain_severity(level: str) -> str:
    return SEVERITY_EXPLANATIONS.get(level, SEVERITY_EXPLANATIONS["待评估"])


def serialize_scale(scale: Scale) -> Dict:
    return {
        "id": scale.id,
        "code": scale.code,
        "title": scale.title,
        "category": scale.category or "综合",
        "description": scale.description,
        "estimated_minutes": scale.estimated_minutes or 5,
        "question_count": len(scale.questions or []),
    }


def build_default_reply(user_message: str) -> str:
    snippet = user_message[:28] or "这件事"
    template = FALLBACK_REPLY_TEMPLATES[abs(hash(user_message)) % len(FALLBACK_REPLY_TEMPLATES)]
    return template.format(snippet=snippet)


def build_default_report(scale: Scale, score: int, severity_level: str, emotion_log: Dict, urgent_text: Optional[str]) -> str:
    dominant = "未采集"
    if emotion_log:
        dominant = max(emotion_log, key=emotion_log.get)
    urgent_block = f"\n## 专业求助建议\n{urgent_text}\n" if urgent_text else ""
    return (
        "⚠️ 本报告仅供参考，不构成医疗诊断或专业心理治疗建议。\n\n"
        f"## 测评概览\n- 量表：{scale.title}\n- 总分：{score}\n- 分级：{severity_level}\n\n"
        f"## 情绪观察\n- 答题期间主导情绪：{dominant}\n\n"
        "## 个性化建议\n"
        "- 保持规律作息，连续 7 天记录睡眠与情绪。\n"
        "- 每天安排 15 分钟中等强度活动，帮助缓解身心紧张。\n"
        "- 与可信赖的人建立每周固定沟通，减少独自承压。\n"
        f"{urgent_block}"
        "\n## 鼓励语\n你已经很勇敢地迈出了关键一步。接下来我们可以继续一起把节奏找回来。"
    )


def build_triage_prompt() -> str:
    return (
        "你是 PsySight 心理支持助手。请按下面要求回答：\n"
        "1) 先给出 2-4 句自然、具体、有共情的回应，必须引用用户提到的细节，不要空泛套话。\n"
        "2) 在回应中给出一个当下可执行的小建议（例如今晚、今天、这一刻能做的）。\n"
        "3) 最后加一句温和追问，帮助用户继续表达。\n"
        "4) 再判断是否推荐量表：失眠->ais，焦虑->gad7，抑郁低落->phq9，不确定则 null。\n"
        "5) 仅输出 JSON，不要输出其他文本。JSON 格式："
        "{\"reply\":\"...\",\"recommended_scale_code\":\"phq9|gad7|ais|null\"}。"
    )


def build_report_prompt() -> str:
    return (
        "你是 PsySight 报告助手，请输出 Markdown，结构固定：\n"
        "1. 免责声明（第一段）\n2. 测评概览（分数与分级）\n3. 情绪观察\n4. 个性化建议（2-3条，可执行）\n5. 下一步行动\n"
        "语言要温暖、具体、简洁。"
    )


@app.route("/api/health", methods=["GET"])
def health_check():
    uptime_sec = int(time.time() - APP_STARTED_AT)
    return jsonify(
        {
            "status": "ok",
            "uptime_seconds": uptime_sec,
            "model": app.config["DEEPSEEK_MODEL"],
            "time": datetime.utcnow().isoformat(),
        }
    )


@app.before_request
def on_request_start():
    g.request_start_at = time.time()


@app.after_request
def on_request_end(response):
    if request.path.startswith("/api/"):
        API_METRICS["total"] += 1
        if response.status_code >= 400:
            API_METRICS["errors"] += 1
        elapsed_ms = int((time.time() - getattr(g, "request_start_at", time.time())) * 1000)
        print(f"API {request.method} {request.path} -> {response.status_code} ({elapsed_ms}ms)")
    return response


@app.route("/api/metrics/availability", methods=["GET"])
def availability_metrics():
    total = API_METRICS["total"]
    errors = API_METRICS["errors"]
    availability = 100.0 if total == 0 else round((total - errors) * 100 / total, 2)
    return jsonify(
        {
            "total_requests": total,
            "error_requests": errors,
            "availability_percent": availability,
            "target_percent": 99,
        }
    )


@app.route("/api/safety/hotlines", methods=["GET"])
def get_hotlines():
    return jsonify({"hotlines": EMERGENCY_HOTLINES})


@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    username = (data.get("username") or "").strip() or email.split("@")[0]

    if not email or not password:
        return jsonify({"error": "邮箱和密码不能为空"}), 400
    if len(password) < 6:
        return jsonify({"error": "密码至少 6 位"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "该邮箱已注册"}), 409

    existing_username = User.query.filter_by(username=username).first()
    if existing_username:
        username = f"{username}_{int(time.time()) % 10000}"

    user = User(email=email, username=username, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    session["user_id"] = user.id
    return jsonify({"id": user.id, "email": user.email, "username": user.username})


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "邮箱或密码错误"}), 401

    user.last_login_at = datetime.utcnow()
    db.session.commit()
    session["user_id"] = user.id
    return jsonify({"id": user.id, "email": user.email, "username": user.username})


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"ok": True})


@app.route("/api/auth/me", methods=["GET"])
def me():
    user = get_current_user()
    if not user:
        return jsonify({"authenticated": False, "user": None})
    return jsonify(
        {
            "authenticated": True,
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "gender": user.gender,
                "age": user.age,
                "region": user.region,
                "show_nickname_in_stats": bool(user.show_nickname_in_stats),
                "public_name": get_user_public_name(user),
            },
        }
    )


@app.route("/api/me/profile", methods=["PATCH"])
def update_profile():
    user = get_current_user()
    if not user:
        return jsonify({"error": "请先登录"}), 401

    data = request.json or {}
    gender = data.get("gender")
    age = data.get("age")
    region = data.get("region")
    show_nickname_in_stats = data.get("show_nickname_in_stats")

    if gender is not None:
        if not isinstance(gender, str):
            return jsonify({"error": "gender 格式错误"}), 400
        gender = gender.strip()
        if len(gender) > 20:
            return jsonify({"error": "gender 长度不能超过20"}), 400
        user.gender = gender or None

    if age is not None:
        if age == "":
            user.age = None
        else:
            try:
                parsed_age = int(age)
            except Exception:
                return jsonify({"error": "age 必须是整数"}), 400
            if parsed_age < 10 or parsed_age > 100:
                return jsonify({"error": "age 需要在 10-100 之间"}), 400
            user.age = parsed_age

    if region is not None:
        if not isinstance(region, str):
            return jsonify({"error": "region 格式错误"}), 400
        region = region.strip()
        if len(region) > 60:
            return jsonify({"error": "region 长度不能超过60"}), 400
        user.region = region or None

    if show_nickname_in_stats is not None:
        if not isinstance(show_nickname_in_stats, bool):
            return jsonify({"error": "show_nickname_in_stats 必须是布尔值"}), 400
        user.show_nickname_in_stats = show_nickname_in_stats

    user.profile_updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(
        {
            "ok": True,
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "gender": user.gender,
                "age": user.age,
                "region": user.region,
                "show_nickname_in_stats": bool(user.show_nickname_in_stats),
                "public_name": get_user_public_name(user),
            },
        }
    )


@app.route("/api/conversations", methods=["GET"])
def list_conversations():
    user = get_current_user()
    if not user:
        return jsonify({"items": []})

    sessions = (
        ConversationSession.query.filter_by(user_id=user.id, is_anonymous=False)
        .order_by(ConversationSession.updated_at.desc())
        .limit(30)
        .all()
    )
    items = [
        {
            "id": item.id,
            "title": item.title,
            "created_at": item.created_at.isoformat(),
            "updated_at": item.updated_at.isoformat(),
        }
        for item in sessions
    ]
    return jsonify({"items": items})


@app.route("/api/conversations", methods=["POST"])
def create_conversation():
    user = get_current_user()
    if not user:
        return jsonify({"error": "请先登录"}), 401
    data = request.json or {}
    title = (data.get("title") or "新对话").strip()
    chat = ConversationSession(user_id=user.id, title=title[:120], is_anonymous=False)
    db.session.add(chat)
    db.session.commit()
    return jsonify({"id": chat.id, "title": chat.title})


@app.route("/api/conversations/<int:session_id>/messages", methods=["GET"])
def conversation_messages(session_id: int):
    user = get_current_user()
    if not user:
        return jsonify({"error": "请先登录"}), 401

    conv = ConversationSession.query.filter_by(id=session_id, user_id=user.id).first_or_404()
    rows = ConversationMessage.query.filter_by(session_id=conv.id).order_by(ConversationMessage.created_at.asc()).all()
    items = []
    for msg in rows:
        scale_payload = None
        if msg.recommended_scale_code:
            scale = get_scale_by_code(msg.recommended_scale_code)
            scale_payload = {
                "id": scale.id if scale else None,
                "code": msg.recommended_scale_code,
                "title": msg.recommended_scale_title,
            }
        items.append(
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "recommended_scale": scale_payload,
                "created_at": msg.created_at.isoformat(),
            }
        )
    return jsonify({"items": items, "session_id": conv.id, "title": conv.title})


@app.route("/api/messages/<int:message_id>/feedback", methods=["POST"])
def message_feedback(message_id: int):
    data = request.json or {}
    feedback = data.get("feedback")
    if feedback not in ("up", "down"):
        return jsonify({"error": "feedback 仅支持 up/down"}), 400

    message = ConversationMessage.query.get_or_404(message_id)
    user = get_current_user()

    # 匿名用户也可以反馈，记录 user_id 为空
    existing = MessageFeedback.query.filter_by(message_id=message.id, user_id=user.id if user else None).first()
    if existing:
        existing.feedback = feedback
    else:
        db.session.add(
            MessageFeedback(message_id=message.id, user_id=user.id if user else None, feedback=feedback)
        )
    db.session.commit()
    return jsonify({"ok": True})


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json or {}
    user_message = (data.get("message") or "").strip()
    session_id = data.get("session_id")
    anonymous = bool(data.get("anonymous", False))

    if not user_message:
        return jsonify({"error": "消息不能为空"}), 400

    user = get_current_user()
    if not user:
        anonymous = True

    conv = None
    context_messages: List[ConversationMessage] = []
    if user and not anonymous:
        if session_id:
            conv = ConversationSession.query.filter_by(id=session_id, user_id=user.id).first()
            if not conv:
                return jsonify({"error": "会话不存在或无权限"}), 404
        else:
            conv = ConversationSession(
                user_id=user.id,
                title=user_message[:20] + ("..." if len(user_message) > 20 else ""),
                is_anonymous=False,
            )
            db.session.add(conv)
            db.session.flush()

        context_messages = (
            ConversationMessage.query.filter_by(session_id=conv.id)
            .order_by(ConversationMessage.created_at.desc())
            .limit(6)
            .all()[::-1]
        )

    context_text = "\n".join([f"{item.role}: {item.content}" for item in context_messages])
    matched_keywords = detect_crisis_keywords(user_message)
    rule_scale_code = recommend_scale_code_by_rules(user_message)

    ai_content = call_deepseek(
        build_triage_prompt(),
        (
            f"用户输入：{user_message}\n"
            f"历史上下文：{context_text if context_text else '无'}\n"
            f"规则初步推荐：{rule_scale_code or 'null'}\n"
            "请先完成自然共情回复，再给出 recommended_scale_code。"
        ),
        max_tokens=520,
        temperature=0.55,
    )
    parsed = extract_json(ai_content)
    reply = parsed.get("reply") if isinstance(parsed, dict) else None

    if not reply and ai_content:
        plain = ai_content.strip()
        if plain.startswith("```json"):
            plain = plain[7:]
        if plain.startswith("```"):
            plain = plain[3:]
        if plain.endswith("```"):
            plain = plain[:-3]
        plain = plain.strip()
        if plain and not plain.startswith("{"):
            reply = plain

    if not reply:
        reply = build_default_reply(user_message)

    model_scale_code = parsed.get("recommended_scale_code") if isinstance(parsed, dict) else None
    if not model_scale_code and ai_content:
        match = re.search(
            r'"recommended_scale_code"\s*:\s*"(phq9|gad7|ais|null|none)"',
            ai_content,
            flags=re.IGNORECASE,
        )
        if match:
            model_scale_code = match.group(1)
    if isinstance(model_scale_code, str):
        model_scale_code = model_scale_code.lower().strip()
    if model_scale_code not in ("phq9", "gad7", "ais", "null", "", "none", None):
        model_scale_code = None
    if model_scale_code in ("null", "", "none"):
        model_scale_code = None
    recommended_code = model_scale_code or rule_scale_code
    recommended_scale = get_scale_by_code(recommended_code)

    user_message_row = None
    assistant_message_row = None
    if conv:
        user_message_row = ConversationMessage(
            session_id=conv.id,
            role="user",
            content=user_message,
            crisis_flag=bool(matched_keywords),
        )
        db.session.add(user_message_row)
        assistant_message_row = ConversationMessage(
            session_id=conv.id,
            role="assistant",
            content=reply,
            recommended_scale_code=recommended_scale.code if recommended_scale else None,
            recommended_scale_title=recommended_scale.title if recommended_scale else None,
            crisis_flag=bool(matched_keywords),
        )
        db.session.add(assistant_message_row)
        conv.updated_at = datetime.utcnow()

    if matched_keywords:
        db.session.add(
            CrisisEvent(
                user_id=user.id if user else None,
                session_id=conv.id if conv else None,
                trigger_text=user_message,
                matched_keywords=matched_keywords,
            )
        )

    db.session.commit()

    response = {
        "reply": reply,
        "session_id": conv.id if conv else None,
        "assistant_message_id": assistant_message_row.id if assistant_message_row else None,
        "recommended_scale": (
            {
                "id": recommended_scale.id,
                "code": recommended_scale.code,
                "title": recommended_scale.title,
            }
            if recommended_scale
            else None
        ),
        "crisis_alert": {
            "show": bool(matched_keywords),
            "keywords": matched_keywords,
            "persistent": bool(matched_keywords),
            "hotlines": EMERGENCY_HOTLINES[:2],
            "message": "你不是一个人。现在请优先联系专业支持，我们在这里陪你。",
        },
    }
    return jsonify(response)


@app.route("/api/scales", methods=["GET"])
def list_scales():
    grouped = request.args.get("grouped") == "1"
    items = [serialize_scale(item) for item in Scale.query.order_by(Scale.category.asc(), Scale.title.asc()).all()]
    if not grouped:
        return jsonify({"items": items})

    categories: Dict[str, List[Dict]] = {}
    for item in items:
        categories.setdefault(item["category"], []).append(item)
    payload = [{"name": key, "items": value} for key, value in categories.items()]
    return jsonify({"categories": payload, "total": len(items)})


@app.route("/api/scales/recommend", methods=["POST"])
def recommend_scale():
    data = request.json or {}
    text_content = (data.get("text") or "").strip()
    code = recommend_scale_code_by_rules(text_content)
    if not code:
        return jsonify({"recommended": []})
    scale = get_scale_by_code(code)
    return jsonify({"recommended": [serialize_scale(scale)] if scale else []})


@app.route("/api/scales/code/<string:scale_code>", methods=["GET"])
def get_scale_by_code_api(scale_code: str):
    scale = get_scale_by_code(scale_code)
    if not scale:
        return jsonify({"error": "量表不存在"}), 404
    payload = serialize_scale(scale)
    payload["questions"] = scale.questions
    payload["scoring_rules"] = scale.scoring_rules
    return jsonify(payload)


@app.route("/api/scales/<int:scale_id>", methods=["GET"])
def get_scale(scale_id: int):
    scale = Scale.query.get_or_404(scale_id)
    payload = serialize_scale(scale)
    payload["questions"] = scale.questions
    payload["scoring_rules"] = scale.scoring_rules
    return jsonify(payload)


@app.route("/api/submit", methods=["POST"])
def submit_assessment():
    data = request.json or {}
    scale_id = data.get("scale_id")
    scale_code = data.get("scale_code")
    answers = data.get("answers") or {}
    emotion_log = data.get("emotion_log") or {}
    emotion_consent = bool(data.get("emotion_consent", False))
    anonymous = bool(data.get("anonymous", False))
    user = get_current_user()

    scale = None
    if scale_id:
        scale = Scale.query.get(scale_id)
    if not scale and scale_code:
        scale = get_scale_by_code(scale_code)
    if not scale:
        return jsonify({"error": "量表不存在"}), 404

    try:
        total_score = sum(int(value) for value in answers.values())
    except Exception:
        return jsonify({"error": "answers 格式错误"}), 400

    # 未授权时不保留情绪数据
    if not emotion_consent:
        emotion_log = {}

    severity_level = get_severity_level(scale.code, total_score)
    urgent_recommendation = get_urgent_recommendation(scale.code, total_score)

    score_explanation = explain_severity(severity_level)
    report_input = (
        f"量表：{scale.title}\n"
        f"得分：{total_score}\n"
        f"分级：{severity_level}\n"
        f"分级解释：{score_explanation}\n"
        f"评分规则：{scale.scoring_rules}\n"
        f"情绪聚合：{json.dumps(emotion_log, ensure_ascii=False)}\n"
        f"危机提示：{urgent_recommendation or '无'}"
    )
    ai_report = call_deepseek(build_report_prompt(), report_input, max_tokens=900, temperature=0.5)
    if not ai_report:
        ai_report = build_default_report(scale, total_score, severity_level, emotion_log, urgent_recommendation)

    record = AssessmentRecord(
        user_id=None if anonymous or not user else user.id,
        scale_id=scale.id,
        total_score=total_score,
        severity_level=severity_level,
        user_answers=answers,
        emotion_log=emotion_log,
        emotion_consent=emotion_consent,
        ai_report=ai_report,
    )
    db.session.add(record)
    db.session.commit()

    return jsonify(
        {
            "record_id": record.id,
            "total_score": total_score,
            "severity_level": severity_level,
            "score_explanation": score_explanation,
            "urgent_recommendation": urgent_recommendation,
            "ai_report": ai_report,
        }
    )


@app.route("/api/report/<int:record_id>", methods=["GET"])
def get_report(record_id: int):
    record = AssessmentRecord.query.get_or_404(record_id)
    current_user = get_current_user()
    is_anonymous_record = record.user_id is None
    if not is_anonymous_record:
        if not current_user or current_user.id != record.user_id:
            return jsonify({"error": "无权限查看该报告"}), 403

    scale = Scale.query.get(record.scale_id)
    urgent = get_urgent_recommendation(scale.code if scale else "", record.total_score or 0)
    owner = User.query.get(record.user_id) if record.user_id else None
    owner_name = owner.username if owner else "匿名用户"
    owner_public_name = get_user_public_name(owner)
    return jsonify(
        {
            "id": record.id,
            "scale": serialize_scale(scale) if scale else None,
            "total_score": record.total_score,
            "severity_level": record.severity_level,
            "score_explanation": explain_severity(record.severity_level or "待评估"),
            "urgent_recommendation": urgent,
            "ai_report": record.ai_report,
            "emotion_log": record.emotion_log or {},
            "emotion_consent": bool(record.emotion_consent),
            "anonymous": is_anonymous_record,
            "owner": (
                {
                    "id": owner.id,
                    "username": owner_name,
                    "public_name": owner_public_name,
                }
                if owner
                else None
            ),
            "hidden_from_stats": bool(record.hidden_from_stats),
            "created_at": record.created_at.isoformat(),
        }
    )


@app.route("/api/reports/me", methods=["GET"])
def my_reports():
    user = get_current_user()
    if not user:
        return jsonify({"error": "请先登录"}), 401

    limit = min(max(int(request.args.get("limit", 50)), 1), 100)
    offset = max(int(request.args.get("offset", 0)), 0)
    rows = (
        db.session.query(AssessmentRecord, Scale)
        .join(Scale, Scale.id == AssessmentRecord.scale_id)
        .filter(AssessmentRecord.user_id == user.id)
        .order_by(AssessmentRecord.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    items = []
    for record, scale in rows:
        items.append(
            {
                "id": record.id,
                "scale": serialize_scale(scale),
                "total_score": record.total_score,
                "severity_level": record.severity_level,
                "score_explanation": explain_severity(record.severity_level or "待评估"),
                "created_at": record.created_at.isoformat(),
                "hidden_from_stats": bool(record.hidden_from_stats),
            }
        )
    return jsonify({"items": items, "count": len(items)})


@app.route("/api/reports/<int:record_id>/stats-visibility", methods=["PATCH"])
def set_report_stats_visibility(record_id: int):
    user = get_current_user()
    if not user:
        return jsonify({"error": "请先登录"}), 401

    record = AssessmentRecord.query.filter_by(id=record_id, user_id=user.id).first()
    if not record:
        return jsonify({"error": "报告不存在或无权限"}), 404

    data = request.json or {}
    hidden = data.get("hidden_from_stats")
    if not isinstance(hidden, bool):
        return jsonify({"error": "hidden_from_stats 必须是布尔值"}), 400

    record.hidden_from_stats = hidden
    db.session.commit()
    return jsonify(
        {
            "ok": True,
            "record_id": record.id,
            "hidden_from_stats": bool(record.hidden_from_stats),
        }
    )


@app.route("/api/canvas/analyze", methods=["POST"])
def analyze_canvas():
    data = request.json or {}
    reflection_text = (data.get("reflection_text") or "").strip()
    drawing_meta = data.get("drawing_meta") or {}
    color_list = drawing_meta.get("colors_used") or []
    stroke_count = drawing_meta.get("stroke_count", 0)
    has_house_tree_person = bool(drawing_meta.get("has_htp_elements", False))

    meta_summary = (
        f"颜色数量：{len(color_list)}，颜色列表：{color_list}\n"
        f"笔画数量：{stroke_count}\n"
        f"是否完成房树人元素：{'是' if has_house_tree_person else '否'}\n"
        f"用户自述：{reflection_text or '无'}"
    )

    system_prompt = (
        "你是心理绘画解读助手。请用温暖通俗语气输出 Markdown，包含：\n"
        "1) 画面元素观察 2) 可能的心理映射 3) 温和建议 4) 鼓励结语。\n"
        "避免绝对化结论，不要下医学诊断。"
    )
    ai_analysis = call_deepseek(system_prompt, meta_summary, max_tokens=700, temperature=0.6)
    if not ai_analysis:
        ai_analysis = (
            "## 画面元素观察\n"
            f"- 你使用了 {len(color_list)} 种颜色，笔画约 {stroke_count} 次。\n"
            f"- 房树人元素完成情况：{'较完整' if has_house_tree_person else '可继续补充'}。\n\n"
            "## 可能的心理映射\n"
            "- 画作表达了你正在尝试把内在感受具象化，这本身就是积极信号。\n"
            "- 颜色与线条节奏反映了你对安全感与秩序感的关注。\n\n"
            "## 温和建议\n"
            "- 可以补充一段“画中人物正在做什么”的文字，帮助自我觉察。\n"
            "- 尝试给画面添加一个让你安心的元素（例如窗户、阳光、道路）。\n\n"
            "## 鼓励结语\n"
            "谢谢你认真地表达自己，你已经在用很有力量的方式照顾内心。"
        )

    return jsonify({"analysis": ai_analysis})


@app.route("/api/stats/summary", methods=["GET"])
def stats_summary():
    visible_filter = (AssessmentRecord.hidden_from_stats.is_(False)) | (AssessmentRecord.hidden_from_stats.is_(None))
    rows = (
        db.session.query(AssessmentRecord, Scale, User)
        .join(Scale, Scale.id == AssessmentRecord.scale_id)
        .outerjoin(User, User.id == AssessmentRecord.user_id)
        .filter(visible_filter)
        .all()
    )

    by_scale: Dict[str, Dict[str, int]] = {}
    age_distribution = {
        "18岁以下": 0,
        "18-22岁": 0,
        "23-26岁": 0,
        "27岁及以上": 0,
        "未填写": 0,
    }
    gender_distribution: Dict[str, int] = {}
    region_distribution: Dict[str, int] = {}
    participant_map: Dict[int, Dict[str, object]] = {}
    word_weights: Dict[str, int] = {}

    def add_word(word: str, weight: int = 1) -> None:
        word_weights[word] = word_weights.get(word, 0) + weight

    def get_age_bucket(age: Optional[int]) -> str:
        if age is None:
            return "未填写"
        if age < 18:
            return "18岁以下"
        if age <= 22:
            return "18-22岁"
        if age <= 26:
            return "23-26岁"
        return "27岁及以上"

    for record, scale, user in rows:
        code = (scale.code or "").lower()
        total_score = int(record.total_score or 0)
        by_scale.setdefault(code, {"total": 0, "severe": 0})
        by_scale[code]["total"] += 1
        severe_threshold = 7 if code == "ais" else 10
        if total_score >= severe_threshold:
            by_scale[code]["severe"] += 1

        if user:
            age_label = get_age_bucket(user.age)
            age_distribution[age_label] = age_distribution.get(age_label, 0) + 1

            gender_label = (user.gender or "").strip() or "未填写"
            gender_distribution[gender_label] = gender_distribution.get(gender_label, 0) + 1

            region_label = (user.region or "").strip() or "未填写"
            region_distribution[region_label] = region_distribution.get(region_label, 0) + 1

            if user.id not in participant_map:
                participant_map[user.id] = {
                    "name": get_user_public_name(user),
                    "region": region_label,
                    "reports": 0,
                }
            participant_map[user.id]["reports"] = int(participant_map[user.id]["reports"]) + 1

        if code == "ais":
            add_word("睡眠")
            if total_score >= 7:
                add_word("失眠", 3)
                add_word("作息紊乱", 2)
        elif code == "gad7":
            add_word("焦虑")
            if total_score >= 10:
                add_word("紧张", 2)
                add_word("担忧", 2)
        elif code == "phq9":
            add_word("情绪低落")
            if total_score >= 10:
                add_word("抑郁风险", 3)
                add_word("动力下降", 2)

        if (record.severity_level or "") in ("中度", "中重度", "重度"):
            add_word("需要支持", 2)
            add_word("心理健康", 1)

    total_records = len(rows)

    def ratio(scale_code: str) -> int:
        total = by_scale.get(scale_code, {}).get("total", 0)
        severe = by_scale.get(scale_code, {}).get("severe", 0)
        if total == 0:
            return 0
        return int(round(severe * 100 / total))

    cards = [
        {"label": "有明显失眠困扰的同龄人", "value": f"{ratio('ais')}%"},
        {"label": "中高焦虑水平的同龄人", "value": f"{ratio('gad7')}%"},
        {"label": "中高抑郁风险的同龄人", "value": f"{ratio('phq9')}%"},
    ]

    demographics = {
        "age_groups": [{"label": label, "value": value} for label, value in age_distribution.items()],
        "genders": [
            {"label": label, "value": value}
            for label, value in sorted(gender_distribution.items(), key=lambda item: item[1], reverse=True)
        ],
        "regions": [
            {"label": label, "value": value}
            for label, value in sorted(region_distribution.items(), key=lambda item: item[1], reverse=True)[:10]
        ],
        "participants": sorted(participant_map.values(), key=lambda item: int(item["reports"]), reverse=True)[:12],
    }
    wordcloud = [
        {"text": label, "weight": weight}
        for label, weight in sorted(word_weights.items(), key=lambda item: item[1], reverse=True)[:24]
    ]

    return jsonify(
        {
            "based_on_n": total_records,
            "cards": cards,
            "overview": {"cards": cards},
            "demographics": demographics,
            "wordcloud": wordcloud,
        }
    )


@app.route("/api/admin/export", methods=["GET"])
def export_records():
    if not is_admin_authorized(request):
        return jsonify({"error": "无管理员权限"}), 403

    fmt = (request.args.get("format") or "json").lower()
    rows = (
        db.session.query(AssessmentRecord, Scale)
        .join(Scale, Scale.id == AssessmentRecord.scale_id)
        .order_by(AssessmentRecord.created_at.desc())
        .all()
    )

    sanitized = []
    for record, scale in rows:
        sanitized.append(
            {
                "record_id": record.id,
                "scale_code": scale.code,
                "scale_title": scale.title,
                "total_score": record.total_score,
                "severity_level": record.severity_level,
                "emotion_log": record.emotion_log or {},
                "emotion_consent": bool(record.emotion_consent),
                "created_at": record.created_at.isoformat(),
            }
        )

    db.session.add(
        ExportAudit(
            export_format=fmt,
            record_count=len(sanitized),
            source_ip=request.headers.get("X-Forwarded-For", request.remote_addr),
        )
    )
    db.session.commit()

    if fmt == "csv":
        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=[
                "record_id",
                "scale_code",
                "scale_title",
                "total_score",
                "severity_level",
                "emotion_log",
                "emotion_consent",
                "created_at",
            ],
        )
        writer.writeheader()
        for row in sanitized:
            row_to_write = {**row, "emotion_log": json.dumps(row["emotion_log"], ensure_ascii=False)}
            writer.writerow(row_to_write)
        csv_text = output.getvalue()
        return Response(
            csv_text,
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment; filename=psysight_research_export.csv"},
        )

    return jsonify({"items": sanitized, "count": len(sanitized)})


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        run_lightweight_migrations()
        db.create_all()
        bootstrap_scale_codes()
    print("🚀 PsySight 后端启动中...")
    print(f"   AI 模型: {app.config['DEEPSEEK_MODEL']}")
    print("   端口: 8004")
    app.run(debug=True, port=8004, host="0.0.0.0", threaded=True)
