from typing import Optional, Protocol


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


class PublicUserLike(Protocol):
    id: int
    username: Optional[str]
    show_nickname_in_stats: bool


def build_anonymous_alias(user_id: int) -> str:
    prefix = ANON_ALIAS_PREFIXES[user_id % len(ANON_ALIAS_PREFIXES)]
    suffix = (user_id * 37) % 100
    return f"{prefix}-{suffix:02d}"


def get_user_public_name(user: Optional[PublicUserLike]) -> str:
    if not user:
        return "匿名用户"
    if user.show_nickname_in_stats and user.username:
        return user.username
    return build_anonymous_alias(user.id)
