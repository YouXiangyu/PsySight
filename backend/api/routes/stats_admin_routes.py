import csv
import io
import json

from flask import Blueprint, Response, current_app, jsonify, request

from application.services.export_service import (
    collect_export_rows,
    is_admin_authorized,
    save_export_audit,
    serialize_export_json,
)
from application.services.stats_service import get_stats_summary


def create_stats_admin_blueprint():
    bp = Blueprint("stats_admin_routes", __name__)

    @bp.route("/api/stats/summary", methods=["GET"])
    def stats_summary_api():
        return jsonify(get_stats_summary())

    @bp.route("/api/admin/export", methods=["GET"])
    def export_records_api():
        if not is_admin_authorized(request, current_app.config):
            return jsonify({"error": "无管理员权限"}), 403

        fmt = (request.args.get("format") or "json").lower()
        rows = collect_export_rows()
        save_export_audit(
            fmt=fmt,
            record_count=len(rows),
            source_ip=request.headers.get("X-Forwarded-For", request.remote_addr),
        )

        if fmt == "csv":
            output = io.StringIO()
            writer = csv.DictWriter(
                output,
                fieldnames=[
                    "record_id",
                    "scale_code",
                    "scale_title",
                    "total_score",
                    "severity_level",
                    "emotion_log",
                    "emotion_consent",
                    "created_at",
                ],
            )
            writer.writeheader()
            for row in rows:
                row_to_write = {**row, "emotion_log": json.dumps(row["emotion_log"], ensure_ascii=False)}
                writer.writerow(row_to_write)
            csv_text = output.getvalue()
            return Response(
                csv_text,
                mimetype="text/csv",
                headers={"Content-Disposition": "attachment; filename=psysight_research_export.csv"},
            )

        return jsonify(serialize_export_json(rows))

    return bp
