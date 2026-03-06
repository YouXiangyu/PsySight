import time
from typing import Mapping

import requests


def call_deepseek(
    config: Mapping[str, object],
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 1200,
    temperature: float = 0.4,
) -> str:
    api_key = str(config.get("DEEPSEEK_API_KEY", ""))
    if not api_key:
        return ""

    base_url = str(config.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")).rstrip("/")
    url = f"{base_url}/chat/completions"
    payload = {
        "model": config.get("DEEPSEEK_MODEL"),
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    start = time.time()
    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=int(config.get("AI_TIMEOUT_SECONDS", 60)),
        )
        response.raise_for_status()
        body = response.json()
        content = body["choices"][0]["message"]["content"]
        elapsed = (time.time() - start) * 1000
        print(f"✅ DeepSeek 响应成功，耗时 {elapsed:.0f}ms")
        return content.strip()
    except Exception as exc:
        print(f"❌ DeepSeek 调用失败: {exc}")
        return ""
