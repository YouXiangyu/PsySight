from typing import Optional

from flask import session

from models import User


def get_current_user() -> Optional[User]:
    user_id = session.get("user_id")
    if not user_id:
        return None
    return User.query.get(user_id)


def set_session_user(user_id: int) -> None:
    session["user_id"] = user_id


def clear_session() -> None:
    session.clear()
