from typing import Dict, List

from domain.rules.crisis_rules import EMERGENCY_HOTLINES


def get_hotlines_payload() -> Dict[str, List[Dict[str, str]]]:
    return {"hotlines": EMERGENCY_HOTLINES}
