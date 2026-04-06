import datetime
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
TODO_PATH = ROOT / "表单todolist.md"


ITEM_RE = re.compile(r"^- \[[xX ]\] \*\*(?P<code>.+?)\*\* - (?P<rest>.+)$")


def ensure_updated_at(text: str) -> str:
    today = datetime.date(2026, 4, 6).isoformat()
    return re.sub(
        r"\*\*创建时间\*\*:\s*([^|]+)\|\s*\*\*更新时间\*\*:\s*.*",
        lambda m: f"**创建时间**: {m.group(1).strip()} | **更新时间**: {today}",
        text,
        count=1,
    )


def ensure_legend(text: str) -> str:
    legend = (
        "**版权/授权标记图例**:\n"
        "- `ⓒ需授权/高风险`: 通常需要购买/获取手册或明确授权才可内置题干与选项（常见于商业化、临床诊断或出版社发行量表）。\n"
        "- `ⓒ需遵循许可`: 题干/选项通常仍受版权保护，但在特定条件下可能允许免费使用/转载（例如需署名、不得商用、不得改编等）；需逐一核对权利方条款。\n"
        "- 说明：这里是**合规风险提示**，最终以权利方/出版方/官方声明为准。\n\n"
    )
    if "版权/授权标记图例" in text:
        return text

    lines = text.splitlines(True)
    out: list[str] = []
    inserted = False
    for i, line in enumerate(lines):
        out.append(line)
        # Insert after the目标行（L3）后的空行（保持排版）
        if not inserted and line.startswith("**目标**"):
            # keep following newline structure; insert legend after next blank line if present
            pass
        if not inserted and i >= 2:
            # After the first block (title + meta + goal) and the first blank line
            if line.strip() == "" and any(l.startswith("**目标**") for l in lines[: i + 1]):
                out.append(legend)
                inserted = True
    if not inserted:
        out.insert(0, legend)
    return "".join(out)


def tag_line(raw: str) -> str:
    m = ITEM_RE.match(raw)
    if not m:
        return raw
    if "ⓒ" in raw:
        return raw

    tag = "ⓒ需遵循许可"
    # Anything already metadata-only is treated as high risk authorization-required for embedding items.
    if "(元数据-only)" in raw or "【元数据】" in raw:
        tag = "ⓒ需授权/高风险"
    return raw + f" {tag}"


def main() -> None:
    text = TODO_PATH.read_text(encoding="utf-8")
    text = ensure_updated_at(text)
    text = ensure_legend(text)

    out_lines = [tag_line(line) for line in text.splitlines()]
    TODO_PATH.write_text("\n".join(out_lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

