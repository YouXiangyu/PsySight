from __future__ import annotations

import base64
import hashlib
import os
import threading
import time
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
import requests


class VisionInputError(ValueError):
    """Raised when the incoming image payload is invalid."""


class VisionModelUnavailable(RuntimeError):
    """Raised when the configured detection/classification models are unavailable."""


CANONICAL_EMOTIONS = (
    "neutral",
    "happy",
    "sad",
    "angry",
    "surprise",
    "fear",
    "disgust",
)

EMOTION_ALIASES = {
    "neutral": "neutral",
    "calm": "neutral",
    "happy": "happy",
    "happiness": "happy",
    "joy": "happy",
    "sad": "sad",
    "sadness": "sad",
    "angry": "angry",
    "anger": "angry",
    "mad": "angry",
    "surprise": "surprise",
    "surprised": "surprise",
    "fear": "fear",
    "fearful": "fear",
    "scared": "fear",
    "disgust": "disgust",
    "disgusted": "disgust",
}


@dataclass(frozen=True)
class ModelAsset:
    key: str
    filename: str
    url: str
    sha256: str = ""


class EmotionEngine:
    def __init__(self, app_config) -> None:
        self._config = app_config
        self._detector = None
        self._classifier = None
        self._load_lock = threading.Lock()
        self._download_locks = {
            "face_detector": threading.Lock(),
            "expression_classifier": threading.Lock(),
        }

    def analyze_frame(self, image_base64: str, mime_type: str | None = None) -> dict:
        frame = self._decode_frame(image_base64, mime_type)
        detector, classifier = self._get_models()

        started_at = time.time()
        detection_result = detector.predict(frame, verbose=False, conf=0.25)[0]
        bbox = self._pick_largest_face(detection_result, frame.shape)
        if bbox is None:
            return {
                "ok": True,
                "face_found": False,
                "emotions": {},
                "latency_ms": int((time.time() - started_at) * 1000),
            }

        x, y, w, h = bbox
        face_crop = frame[y:y + h, x:x + w]
        if face_crop.size == 0:
            return {
                "ok": True,
                "face_found": False,
                "emotions": {},
                "latency_ms": int((time.time() - started_at) * 1000),
            }

        classification_result = classifier.predict(face_crop, verbose=False)[0]
        emotions = self._extract_emotions(classification_result)
        dominant_emotion, dominant_score = max(emotions.items(), key=lambda item: item[1])

        return {
            "ok": True,
            "face_found": True,
            "bbox": {"x": x, "y": y, "w": w, "h": h},
            "dominant_emotion": dominant_emotion,
            "dominant_score": round(float(dominant_score), 4),
            "emotions": emotions,
            "latency_ms": int((time.time() - started_at) * 1000),
        }

    def _get_models(self):
        if self._detector is not None and self._classifier is not None:
            return self._detector, self._classifier

        with self._load_lock:
            if self._detector is not None and self._classifier is not None:
                return self._detector, self._classifier

            face_asset, expr_asset = self._build_manifest()
            face_path = self._ensure_asset(face_asset)
            expr_path = self._ensure_asset(expr_asset)

            try:
                from ultralytics import YOLO
            except Exception as exc:  # pragma: no cover - environment specific
                raise VisionModelUnavailable("Ultralytics is not installed") from exc

            try:
                self._detector = YOLO(str(face_path))
                self._classifier = YOLO(str(expr_path))
            except Exception as exc:
                raise VisionModelUnavailable("Failed to load vision models") from exc

        return self._detector, self._classifier

    def _build_manifest(self) -> tuple[ModelAsset, ModelAsset]:
        base_url = str(self._config.get("VISION_RELEASE_BASE_URL", "")).rstrip("/")
        face_url = self._config.get("VISION_FACE_MODEL_URL") or f"{base_url}/yolo11_face.pt"
        expr_url = self._config.get("VISION_EXPR_MODEL_URL") or f"{base_url}/yolo11_expr_cls.pt"
        face_sha = self._config.get("VISION_FACE_MODEL_SHA256", "")
        expr_sha = self._config.get("VISION_EXPR_MODEL_SHA256", "")

        return (
            ModelAsset(
                key="face_detector",
                filename="yolo11_face.pt",
                url=face_url,
                sha256=face_sha,
            ),
            ModelAsset(
                key="expression_classifier",
                filename="yolo11_expr_cls.pt",
                url=expr_url,
                sha256=expr_sha,
            ),
        )

    def _decode_frame(self, image_base64: str, mime_type: str | None) -> np.ndarray:
        if mime_type and mime_type not in {"image/jpeg", "image/jpg"}:
            raise VisionInputError("Only JPEG frames are supported")
        if not isinstance(image_base64, str) or not image_base64.strip():
            raise VisionInputError("image_base64 is required")

        try:
            raw_bytes = base64.b64decode(image_base64, validate=True)
        except Exception as exc:
            raise VisionInputError("image_base64 is not valid base64") from exc

        if not raw_bytes:
            raise VisionInputError("Decoded image payload is empty")
        if len(raw_bytes) > int(self._config.get("VISION_MAX_IMAGE_BYTES", 1048576)):
            raise VisionInputError("Decoded image payload is too large")

        image_array = np.frombuffer(raw_bytes, dtype=np.uint8)
        frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        if frame is None:
            raise VisionInputError("Failed to decode JPEG payload")
        return frame

    def _pick_largest_face(self, detection_result, shape: tuple[int, int, int]) -> tuple[int, int, int, int] | None:
        boxes = getattr(detection_result, "boxes", None)
        if boxes is None or boxes.xyxy is None or len(boxes.xyxy) == 0:
            return None

        names = getattr(detection_result, "names", {}) or {}
        height, width = shape[:2]
        candidates: list[tuple[int, int, int, int, int]] = []

        for index, xyxy in enumerate(boxes.xyxy.tolist()):
            class_id = int(boxes.cls[index].item()) if boxes.cls is not None else -1
            class_name = str(names.get(class_id, "")).lower()
            if names and "face" not in class_name and class_name not in {"", "0"}:
                continue

            x1, y1, x2, y2 = [int(round(value)) for value in xyxy]
            x1 = max(0, min(x1, width - 1))
            y1 = max(0, min(y1, height - 1))
            x2 = max(x1 + 1, min(x2, width))
            y2 = max(y1 + 1, min(y2, height))
            box_width = x2 - x1
            box_height = y2 - y1
            candidates.append((box_width * box_height, x1, y1, box_width, box_height))

        if not candidates:
            return None

        _, x, y, w, h = max(candidates, key=lambda item: item[0])
        return x, y, w, h

    def _extract_emotions(self, classification_result) -> dict[str, float]:
        probs = getattr(classification_result, "probs", None)
        names = getattr(classification_result, "names", {}) or {}
        if probs is None or getattr(probs, "data", None) is None:
            raise VisionModelUnavailable("Expression model did not return probability scores")

        raw_scores = probs.data.tolist()
        canonical_scores = {emotion: 0.0 for emotion in CANONICAL_EMOTIONS}

        for index, score in enumerate(raw_scores):
            label = str(names.get(index, "")).strip().lower()
            canonical_label = EMOTION_ALIASES.get(label)
            if canonical_label:
                canonical_scores[canonical_label] += float(score)

        total = sum(canonical_scores.values())
        if total <= 0:
            raise VisionModelUnavailable("Expression model labels do not match the expected emotion set")

        return {emotion: round(score / total, 4) for emotion, score in canonical_scores.items()}

    def _ensure_asset(self, asset: ModelAsset) -> Path:
        model_dir = Path(self._config["VISION_MODEL_DIR"])
        model_dir.mkdir(parents=True, exist_ok=True)
        target_path = model_dir / asset.filename

        if target_path.exists() and self._verify_sha256(target_path, asset.sha256):
            return target_path

        if target_path.exists():
            target_path.unlink()

        if not self._config.get("VISION_AUTO_DOWNLOAD_ENABLED", True):
            raise VisionModelUnavailable(f"Model asset missing: {asset.filename}")

        if not asset.url:
            raise VisionModelUnavailable(f"Model URL is not configured for {asset.filename}")

        download_lock = self._download_locks[asset.key]
        with download_lock:
            if target_path.exists() and self._verify_sha256(target_path, asset.sha256):
                return target_path
            self._download_asset(asset, target_path)

        if not self._verify_sha256(target_path, asset.sha256):
            try:
                target_path.unlink()
            except OSError:
                pass
            raise VisionModelUnavailable(f"Checksum verification failed for {asset.filename}")

        return target_path

    def _download_asset(self, asset: ModelAsset, target_path: Path) -> None:
        temp_path = target_path.with_suffix(target_path.suffix + ".part")
        timeout = int(self._config.get("VISION_MODEL_DOWNLOAD_TIMEOUT_SECONDS", 180))

        try:
            with requests.get(asset.url, stream=True, timeout=timeout) as response:
                response.raise_for_status()
                with open(temp_path, "wb") as file_obj:
                    for chunk in response.iter_content(chunk_size=1024 * 1024):
                        if chunk:
                            file_obj.write(chunk)
            os.replace(temp_path, target_path)
        except Exception as exc:
            try:
                if temp_path.exists():
                    temp_path.unlink()
            except OSError:
                pass
            raise VisionModelUnavailable(f"Failed to download model asset: {asset.filename}") from exc

    @staticmethod
    def _verify_sha256(target_path: Path, expected_sha256: str) -> bool:
        if not target_path.exists():
            return False
        if not expected_sha256:
            return True

        digest = hashlib.sha256()
        with open(target_path, "rb") as file_obj:
            for chunk in iter(lambda: file_obj.read(1024 * 1024), b""):
                digest.update(chunk)
        return digest.hexdigest().lower() == expected_sha256.lower()
