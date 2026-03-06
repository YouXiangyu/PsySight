from typing import Optional


SCALE_KEYWORD_RULES = {
    "ais": ["失眠", "睡不着", "睡眠", "早醒", "入睡困难"],
    "gad7": ["焦虑", "紧张", "担忧", "害怕", "惊恐", "放松不下来"],
    "phq9": ["抑郁", "低落", "没兴趣", "绝望", "情绪不好", "心情差"],
}


def recommend_scale_code_by_rules(content: str) -> Optional[str]:
    text = content.lower()
    for code, keywords in SCALE_KEYWORD_RULES.items():
        if any(keyword in text for keyword in keywords):
            return code
    return None
