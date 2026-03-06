from typing import Dict, Tuple

from infrastructure.ai.client import call_deepseek
from infrastructure.ai.prompts import build_canvas_prompt


def analyze_canvas(data: Dict, app_config) -> Tuple[Dict, int]:
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

    ai_analysis = call_deepseek(app_config, build_canvas_prompt(), meta_summary, max_tokens=700, temperature=0.6)
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
    return {"analysis": ai_analysis}, 200
