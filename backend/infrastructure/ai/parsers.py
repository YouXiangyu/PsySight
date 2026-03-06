import json
import re
from typing import Dict, Optional


def strip_code_fence(raw_text: str) -> str:
    cleaned = raw_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()


def extract_json(raw_text: str) -> Dict:
    if not raw_text:
        return {}
    cleaned = strip_code_fence(raw_text)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                return {}
    return {}


def extract_plain_reply(raw_text: str) -> Optional[str]:
    if not raw_text:
        return None
    cleaned = strip_code_fence(raw_text)
    if cleaned and not cleaned.startswith("{"):
        return cleaned
    return None


def extract_recommended_scale_code_from_raw(raw_text: str) -> Optional[str]:
    if not raw_text:
        return None
    match = re.search(
        r'"recommended_scale_code"\s*:\s*"(phq9|gad7|ais|null|none)"',
        raw_text,
        flags=re.IGNORECASE,
    )
    if not match:
        return None
    return match.group(1)


def normalize_recommended_scale_code(scale_code: Optional[str]) -> Optional[str]:
    if isinstance(scale_code, str):
        normalized = scale_code.lower().strip()
    else:
        normalized = scale_code
    if normalized not in ("phq9", "gad7", "ais", "null", "", "none", None):
        return None
    if normalized in ("null", "", "none"):
        return None
    return normalized
