import time
from datetime import datetime
from typing import Dict, Optional, Tuple

from werkzeug.security import check_password_hash, generate_password_hash

from domain.rules.user_display_rules import get_user_public_name
from models import User, db


def serialize_user(user: User) -> Dict:
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "gender": user.gender,
        "age": user.age,
        "region": user.region,
        "show_nickname_in_stats": bool(user.show_nickname_in_stats),
        "public_name": get_user_public_name(user),
    }


def validate_register_payload(email: str, password: str) -> Optional[Tuple[Dict, int]]:
    if not email or not password:
        return {"error": "邮箱和密码不能为空"}, 400
    if len(password) < 6:
        return {"error": "密码至少 6 位"}, 400
    if User.query.filter_by(email=email).first():
        return {"error": "该邮箱已注册"}, 409
    return None


def register_user(email: str, password: str, username: str) -> User:
    existing_username = User.query.filter_by(username=username).first()
    if existing_username:
        username = f"{username}_{int(time.time()) % 10000}"
    user = User(email=email, username=username, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    return user


def login_user(email: str, password: str) -> Optional[User]:
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return None
    user.last_login_at = datetime.utcnow()
    db.session.commit()
    return user


def update_profile(user: User, payload: Dict) -> Optional[Tuple[Dict, int]]:
    gender = payload.get("gender")
    age = payload.get("age")
    region = payload.get("region")
    show_nickname_in_stats = payload.get("show_nickname_in_stats")

    if gender is not None:
        if not isinstance(gender, str):
            return {"error": "gender 格式错误"}, 400
        gender = gender.strip()
        if len(gender) > 20:
            return {"error": "gender 长度不能超过20"}, 400
        user.gender = gender or None

    if age is not None:
        if age == "":
            user.age = None
        else:
            try:
                parsed_age = int(age)
            except Exception:
                return {"error": "age 必须是整数"}, 400
            if parsed_age < 10 or parsed_age > 100:
                return {"error": "age 需要在 10-100 之间"}, 400
            user.age = parsed_age

    if region is not None:
        if not isinstance(region, str):
            return {"error": "region 格式错误"}, 400
        region = region.strip()
        if len(region) > 60:
            return {"error": "region 长度不能超过60"}, 400
        user.region = region or None

    if show_nickname_in_stats is not None:
        if not isinstance(show_nickname_in_stats, bool):
            return {"error": "show_nickname_in_stats 必须是布尔值"}, 400
        user.show_nickname_in_stats = show_nickname_in_stats

    user.profile_updated_at = datetime.utcnow()
    db.session.commit()
    return None
