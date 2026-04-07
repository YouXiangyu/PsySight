from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class UserProfile:
    """Long-term user psychological profile, persisted via Flask DB."""

    user_id: int | None = None
    username: str | None = None
    persona: str | None = None
    communication_style: str | None = None
    core_concerns: list[str] = field(default_factory=list)
    history_summary: str | None = None
    recent_assessments: list[dict] = field(default_factory=list)

    def to_prompt_context(self) -> str:
        parts = []
        if self.persona:
            parts.append(f"用户性格画像: {self.persona}")
        if self.communication_style:
            parts.append(f"沟通风格: {self.communication_style}")
        if self.core_concerns:
            parts.append(f"核心心理诉求: {', '.join(self.core_concerns)}")
        if self.history_summary:
            parts.append(f"历史摘要: {self.history_summary}")
        if self.recent_assessments:
            assessment_lines = []
            for a in self.recent_assessments[:3]:
                assessment_lines.append(
                    f"  - {a.get('scale_title', '?')}: {a.get('score')}分 "
                    f"({a.get('severity', '?')}) @ {a.get('date', '?')}"
                )
            parts.append("最近测评:\n" + "\n".join(assessment_lines))
        return "\n".join(parts) if parts else "新用户，暂无历史画像。"

    @classmethod
    def from_api_response(cls, data: dict) -> UserProfile:
        return cls(
            user_id=data.get("user_id"),
            username=data.get("username"),
            persona=data.get("persona"),
            communication_style=data.get("communication_style"),
            core_concerns=data.get("core_concerns") or [],
            history_summary=data.get("history_summary"),
            recent_assessments=data.get("recent_assessments") or [],
        )
