from __future__ import annotations

from pydantic import BaseModel, Field


class AgentChatRequest(BaseModel):
    message: str
    session_id: int | None = None
    user_id: int | None = None
    anonymous: bool = False
    use_thinking: bool = False
    search_mode: str = Field(default="index", pattern="^(index|rag)$")


class ScaleRecommendationItem(BaseModel):
    code: str
    title: str
    scale_id: int | None = None


class CrisisAlertResponse(BaseModel):
    show: bool
    keywords: list[str]
    hotlines: list[dict]
    message: str
    persistent: bool


class AgentChatResponse(BaseModel):
    reply: str
    session_id: int | None = None
    assistant_message_id: int | None = None
    recommended_scales: list[ScaleRecommendationItem] = []
    crisis_alert: CrisisAlertResponse | None = None
    model_used: str = ""
    search_mode_used: str = ""
    intent_detected: str = ""
