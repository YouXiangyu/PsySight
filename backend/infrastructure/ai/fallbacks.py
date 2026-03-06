FALLBACK_REPLY_TEMPLATES = [
    "谢谢你愿意说出来。我注意到你提到“{snippet}”，这件事确实会让人很耗能。我们先从今天最难熬的那个时刻聊起，好吗？",
    "你把这些感受讲出来已经很不容易了，尤其是“{snippet}”这部分。若你愿意，我们可以先找一个今晚就能做到的小动作，帮你把状态拉回一点点。",
    "读到“{snippet}”我能感受到你在硬撑。你不是一个人，我们可以一步一步来。现在你更希望我先陪你梳理情绪，还是先给你一个具体的应对办法？",
]


def build_default_reply(user_message: str) -> str:
    snippet = user_message[:28] or "这件事"
    template = FALLBACK_REPLY_TEMPLATES[abs(hash(user_message)) % len(FALLBACK_REPLY_TEMPLATES)]
    return template.format(snippet=snippet)
