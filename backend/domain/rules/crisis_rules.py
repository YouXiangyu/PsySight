from typing import List


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


def detect_crisis_keywords(content: str) -> List[str]:
    return [keyword for keyword in CRISIS_KEYWORDS if keyword in content]
