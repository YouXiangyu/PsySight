from __future__ import annotations

from functools import lru_cache

from langchain_openai import ChatOpenAI

import config


@lru_cache(maxsize=2)
def _build_llm(model_name: str) -> ChatOpenAI:
    return ChatOpenAI(
        model=model_name,
        api_key=config.DEEPSEEK_API_KEY,
        base_url=config.DEEPSEEK_BASE_URL,
        temperature=0.5,
        max_tokens=1200,
        request_timeout=config.AI_TIMEOUT_SECONDS,
    )


def get_llm(use_thinking: bool = False) -> ChatOpenAI:
    model = config.DEEPSEEK_MODEL_THINK if use_thinking else config.DEEPSEEK_MODEL_FAST
    return _build_llm(model)


def get_router_llm() -> ChatOpenAI:
    """Router always uses the fast model for low latency."""
    return _build_llm(config.DEEPSEEK_MODEL_FAST)
