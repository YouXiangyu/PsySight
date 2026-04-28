from __future__ import annotations

from functools import lru_cache

from infrastructure.vision.emotion_engine import EmotionEngine, VisionInputError, VisionModelUnavailable


@lru_cache(maxsize=1)
def get_emotion_engine() -> EmotionEngine:
    from flask import current_app

    return EmotionEngine(current_app.config)


def analyze_emotion_payload(data: dict) -> tuple[dict, int]:
    image_base64 = data.get("image_base64")
    mime_type = data.get("mime_type")

    try:
        result = get_emotion_engine().analyze_frame(image_base64=image_base64, mime_type=mime_type)
    except VisionInputError as exc:
        return {"error": str(exc), "code": "invalid_image_payload"}, 400
    except VisionModelUnavailable as exc:
        return {"error": str(exc), "code": "vision_model_unavailable"}, 503
    except Exception:
        return {"error": "Emotion analysis failed", "code": "vision_inference_failed"}, 500

    return result, 200
