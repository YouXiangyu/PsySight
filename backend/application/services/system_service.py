from datetime import datetime
from typing import Dict


def build_health_payload(model_name: str, app_started_at: float) -> Dict:
    uptime_sec = int(datetime.now().timestamp() - app_started_at)
    return {
        "status": "ok",
        "uptime_seconds": uptime_sec,
        "model": model_name,
        "time": datetime.utcnow().isoformat(),
    }


def build_availability_payload(api_metrics: Dict[str, int]) -> Dict:
    total = api_metrics["total"]
    errors = api_metrics["errors"]
    availability = 100.0 if total == 0 else round((total - errors) * 100 / total, 2)
    return {
        "total_requests": total,
        "error_requests": errors,
        "availability_percent": availability,
        "target_percent": 99,
    }
