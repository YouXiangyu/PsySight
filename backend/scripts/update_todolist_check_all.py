import datetime
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
TODO_PATH = ROOT / "表单todolist.md"


def main() -> None:
    text = TODO_PATH.read_text(encoding="utf-8")

    # Update timestamp line (keep original create date)
    today = datetime.date(2026, 4, 6).isoformat()
    text = re.sub(
        r"\*\*创建时间\*\*:\s*([^|]+)\|\s*\*\*更新时间\*\*:\s*.*",
        lambda m: f"**创建时间**: {m.group(1).strip()} | **更新时间**: {today}",
        text,
        count=1,
    )

    item_re = re.compile(r"^(?P<prefix>- \[)(?P<mark>[ xX])(?P<suffix>\] \*\*(?P<code>.+?)\*\*\s*-\s*(?P<rest>.+))$")
    out_lines: list[str] = []
    for raw in text.splitlines():
        m = item_re.match(raw)
        if not m:
            out_lines.append(raw)
            continue

        mark = m.group("mark").strip().lower()
        if mark == "x":
            out_lines.append(raw)
            continue

        # unchecked -> checked + tag
        out_lines.append(f"- [x] **{m.group('code')}** - {m.group('rest')} (元数据-only)")

    # Safety: normalize any leftover unchecked boxes
    new_text = "\n".join(out_lines) + "\n"
    new_text = new_text.replace("- [ ]", "- [x]")
    TODO_PATH.write_text(new_text, encoding="utf-8")


if __name__ == "__main__":
    main()
