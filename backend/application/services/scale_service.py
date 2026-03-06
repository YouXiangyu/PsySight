from typing import Dict, List, Optional

from sqlalchemy import func

from domain.rules.scale_rules import recommend_scale_code_by_rules
from models import Scale


def serialize_scale(scale: Scale) -> Dict:
    return {
        "id": scale.id,
        "code": scale.code,
        "title": scale.title,
        "category": scale.category or "综合",
        "description": scale.description,
        "estimated_minutes": scale.estimated_minutes or 5,
        "question_count": len(scale.questions or []),
    }


def get_scale_by_code(code: Optional[str]) -> Optional[Scale]:
    if not code:
        return None
    return Scale.query.filter(func.lower(Scale.code) == code.lower()).first()


def list_scales_payload(grouped: bool = False) -> Dict:
    items = [serialize_scale(item) for item in Scale.query.order_by(Scale.category.asc(), Scale.title.asc()).all()]
    if not grouped:
        return {"items": items}

    categories: Dict[str, List[Dict]] = {}
    for item in items:
        categories.setdefault(item["category"], []).append(item)
    payload = [{"name": key, "items": value} for key, value in categories.items()]
    return {"categories": payload, "total": len(items)}


def recommend_scale_payload(text_content: str) -> Dict:
    code = recommend_scale_code_by_rules(text_content)
    if not code:
        return {"recommended": []}
    scale = get_scale_by_code(code)
    return {"recommended": [serialize_scale(scale)] if scale else []}


def get_scale_by_code_payload(scale_code: str) -> Optional[Dict]:
    scale = get_scale_by_code(scale_code)
    if not scale:
        return None
    payload = serialize_scale(scale)
    payload["questions"] = scale.questions
    payload["scoring_rules"] = scale.scoring_rules
    return payload


def get_scale_by_id_payload(scale_id: int) -> Optional[Dict]:
    scale = Scale.query.get(scale_id)
    if not scale:
        return None
    payload = serialize_scale(scale)
    payload["questions"] = scale.questions
    payload["scoring_rules"] = scale.scoring_rules
    return payload
