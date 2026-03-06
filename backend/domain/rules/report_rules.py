from typing import Dict, Optional


def build_default_report(scale, score: int, severity_level: str, emotion_log: Dict, urgent_text: Optional[str]) -> str:
    dominant = "未采集"
    if emotion_log:
        dominant = max(emotion_log, key=emotion_log.get)
    urgent_block = f"\n## 专业求助建议\n{urgent_text}\n" if urgent_text else ""
    scale_title = getattr(scale, "title", "心理测评")
    return (
        "⚠️ 本报告仅供参考，不构成医疗诊断或专业心理治疗建议。\n\n"
        f"## 测评概览\n- 量表：{scale_title}\n- 总分：{score}\n- 分级：{severity_level}\n\n"
        f"## 情绪观察\n- 答题期间主导情绪：{dominant}\n\n"
        "## 个性化建议\n"
        "- 保持规律作息，连续 7 天记录睡眠与情绪。\n"
        "- 每天安排 15 分钟中等强度活动，帮助缓解身心紧张。\n"
        "- 与可信赖的人建立每周固定沟通，减少独自承压。\n"
        f"{urgent_block}"
        "\n## 鼓励语\n你已经很勇敢地迈出了关键一步。接下来我们可以继续一起把节奏找回来。"
    )
