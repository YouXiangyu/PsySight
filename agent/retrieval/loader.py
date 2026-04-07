from __future__ import annotations

import json
from pathlib import Path


SCALE_INDEX_PATH = Path(__file__).parent / "scale_index_data.json"
SCALES_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "backend" / "data" / "scales"


def load_scale_index() -> list[dict]:
    if SCALE_INDEX_PATH.exists():
        with open(SCALE_INDEX_PATH, encoding="utf-8") as f:
            return json.load(f)
    return _build_index_from_raw()


def _build_index_from_raw() -> list[dict]:
    """Fallback: build a minimal index from raw scale JSONs if prebuilt index is missing."""
    index = []
    if not SCALES_DATA_DIR.exists():
        return index
    for path in sorted(SCALES_DATA_DIR.glob("*.json")):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        code = path.stem
        title = data.get("title", code)
        description = data.get("description", "")
        questions = data.get("questions", [])
        question_texts = " ".join(q.get("text", "") for q in questions[:5])
        index.append({
            "code": code,
            "title": title,
            "category": "综合",
            "symptoms": [],
            "searchable_text": f"{title} {description} {question_texts}"[:120],
        })
    return index
