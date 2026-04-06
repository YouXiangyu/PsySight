import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
TODO_PATH = ROOT / "表单todolist.md"
SCALES_DIR = ROOT / "backend" / "data" / "scales"


ITEM_RE = re.compile(r"^- \[([ xX])\] \*\*(.+?)\*\*\s*-\s*(.+)$", re.M)


def slug(code: str) -> str:
    s = code.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s


def guess_item_count(text: str) -> int | None:
    # examples: "(187题)" "(6/18题)" "(36/144题)" "(40/60题)"
    m = re.search(r"\(([^)]*?)题\)", text)
    if not m:
        return None
    content = m.group(1)
    numbers = [int(x) for x in re.findall(r"\d+", content)]
    if not numbers:
        return None
    return max(numbers)


def build_metadata_json(code: str, rest: str) -> dict:
    # Keep original display line as reference, but don't claim copyright status here.
    item_count = guess_item_count(rest)
    count_line = f"题量: {item_count}。" if item_count else "题量: 未在清单中标明。"
    title = f"【元数据】{code} - {rest.split('(')[0].strip()}"
    description = (
        "【元数据】该量表题目原文可能受版权/授权限制，本仓库默认不内置题目原文。"
        f"{count_line} 需要授权或参考原始手册/论文获取正式题目。"
    )
    scoring_rules = (
        "【元数据】计分/常模/阈值请参考原始手册或权威论文（后续可补充来源索引）。"
    )
    return {
        "title": title,
        "description": description,
        "questions": [],
        "scoring_rules": scoring_rules,
    }


def main() -> None:
    if not TODO_PATH.exists():
        raise SystemExit(f"Missing {TODO_PATH}")
    SCALES_DIR.mkdir(parents=True, exist_ok=True)

    text = TODO_PATH.read_text(encoding="utf-8")
    items = [(m.group(1).strip().lower() == "x", m.group(2).strip(), m.group(3).strip()) for m in ITEM_RE.finditer(text)]
    unchecked = [(code, rest) for checked, code, rest in items if not checked]

    existing = {p.stem.lower() for p in SCALES_DIR.glob("*.json")}
    created = 0
    skipped = 0
    for code, rest in unchecked:
        fn = slug(code)
        if fn in existing:
            skipped += 1
            continue
        payload = build_metadata_json(code, rest)
        path = SCALES_DIR / f"{fn}.json"
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        created += 1

    print(f"Unchecked scales: {len(unchecked)}")
    print(f"Created: {created}")
    print(f"Skipped (already exists): {skipped}")


if __name__ == "__main__":
    main()
