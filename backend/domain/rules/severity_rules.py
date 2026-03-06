from typing import Optional


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
