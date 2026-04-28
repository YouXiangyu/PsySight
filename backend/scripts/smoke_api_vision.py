import base64
import io
import os
import sys
import tempfile
import unittest
import uuid
from pathlib import Path
from unittest.mock import patch

from PIL import Image


BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

_db_path = Path(tempfile.gettempdir()) / f"psysight_vision_smoke_{uuid.uuid4().hex}.db"
_model_dir = Path(tempfile.gettempdir()) / f"psysight_vision_models_{uuid.uuid4().hex}"
os.environ["DATABASE_URL"] = f"sqlite:///{_db_path.as_posix()}"
os.environ["DEEPSEEK_API_KEY"] = ""
os.environ["ADMIN_EXPORT_TOKEN"] = "vision-smoke-admin-token"
os.environ["SECRET_KEY"] = "vision-smoke-secret-key"
os.environ["VISION_AUTO_DOWNLOAD_ENABLED"] = "false"
os.environ["VISION_MODEL_DIR"] = _model_dir.as_posix()

import app as backend_app  # noqa: E402
from application.services import vision_service  # noqa: E402


class VisionApiSmokeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.app = backend_app.app
        cls.client = cls.app.test_client()

    def setUp(self) -> None:
        vision_service.get_emotion_engine.cache_clear()

    def _jpeg_base64(self) -> str:
        image = Image.new("RGB", (8, 8), color=(255, 255, 255))
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG")
        return base64.b64encode(buffer.getvalue()).decode("ascii")

    def test_01_invalid_base64_returns_400(self) -> None:
        response = self.client.post(
            "/api/vision/emotion/analyze",
            json={"image_base64": "not-base64", "mime_type": "image/jpeg"},
        )
        self.assertEqual(response.status_code, 400)
        payload = response.get_json()
        self.assertEqual(payload["code"], "invalid_image_payload")

    def test_02_invalid_mime_type_returns_400(self) -> None:
        response = self.client.post(
            "/api/vision/emotion/analyze",
            json={"image_base64": self._jpeg_base64(), "mime_type": "image/png"},
        )
        self.assertEqual(response.status_code, 400)
        payload = response.get_json()
        self.assertEqual(payload["code"], "invalid_image_payload")

    def test_03_missing_models_returns_503(self) -> None:
        response = self.client.post(
            "/api/vision/emotion/analyze",
            json={"image_base64": self._jpeg_base64(), "mime_type": "image/jpeg"},
        )
        self.assertEqual(response.status_code, 503)
        payload = response.get_json()
        self.assertEqual(payload["code"], "vision_model_unavailable")

    def test_04_valid_jpeg_without_face_returns_200(self) -> None:
        class FakeEngine:
            def analyze_frame(self, image_base64: str, mime_type: str | None = None) -> dict:
                return {
                    "ok": True,
                    "face_found": False,
                    "emotions": {},
                    "latency_ms": 1,
                }

        with patch.object(vision_service, "get_emotion_engine", return_value=FakeEngine()):
            response = self.client.post(
                "/api/vision/emotion/analyze",
                json={"image_base64": self._jpeg_base64(), "mime_type": "image/jpeg"},
            )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertTrue(payload["ok"])
        self.assertFalse(payload["face_found"])
        self.assertEqual(payload["emotions"], {})


if __name__ == "__main__":
    unittest.main(verbosity=2)
