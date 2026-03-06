import json
from typing import Dict, List, Tuple

from models import AssessmentRecord, ExportAudit, Scale, db


def collect_export_rows() -> List[Dict]:
    rows = (
        db.session.query(AssessmentRecord, Scale)
        .join(Scale, Scale.id == AssessmentRecord.scale_id)
        .order_by(AssessmentRecord.created_at.desc())
        .all()
    )
    sanitized = []
    for record, scale in rows:
        sanitized.append(
            {
                "record_id": record.id,
                "scale_code": scale.code,
                "scale_title": scale.title,
                "total_score": record.total_score,
                "severity_level": record.severity_level,
                "emotion_log": record.emotion_log or {},
                "emotion_consent": bool(record.emotion_consent),
                "created_at": record.created_at.isoformat(),
            }
        )
    return sanitized


def save_export_audit(fmt: str, source_ip: str, record_count: int) -> None:
    db.session.add(
        ExportAudit(
            export_format=fmt,
            record_count=record_count,
            source_ip=source_ip,
        )
    )
    db.session.commit()


def is_admin_authorized(req, config) -> bool:
    token = req.headers.get("X-Admin-Token", "")
    return bool(config["ADMIN_EXPORT_TOKEN"]) and token == config["ADMIN_EXPORT_TOKEN"]


def serialize_export_json(rows: List[Dict]) -> Dict:
    return {"items": rows, "count": len(rows)}


def serialize_export_csv(rows: List[Dict]) -> Tuple[str, List[str]]:
    header = [
        "record_id",
        "scale_code",
        "scale_title",
        "total_score",
        "severity_level",
        "emotion_log",
        "emotion_consent",
        "created_at",
    ]
    lines = [",".join(header)]
    for row in rows:
        values = [
            str(row["record_id"]),
            str(row["scale_code"]),
            str(row["scale_title"]),
            str(row["total_score"]),
            str(row["severity_level"]),
            json.dumps(row["emotion_log"], ensure_ascii=False).replace(",", " "),
            str(row["emotion_consent"]),
            str(row["created_at"]),
        ]
        lines.append(",".join(values))
    return "\n".join(lines), header
