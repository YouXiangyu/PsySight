import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent


def _resolve_path(value: str, fallback: Path) -> str:
    if not value:
        return str(fallback)
    raw_path = Path(value)
    if raw_path.is_absolute():
        return str(raw_path)
    return str((BASE_DIR / raw_path).resolve())


class Config:
    # DeepSeek API Configuration
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
    DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-reasoner")
    AI_TIMEOUT_SECONDS = int(os.getenv("AI_TIMEOUT_SECONDS", "60"))

    # Admin export capability
    ADMIN_EXPORT_TOKEN = os.getenv("ADMIN_EXPORT_TOKEN", "")

    # Internal API token for agent service communication
    INTERNAL_API_TOKEN = os.getenv("INTERNAL_API_TOKEN", "psysight-internal-dev-token")

    # Database Configuration
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///psysight.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Flask Config
    SECRET_KEY = os.getenv("SECRET_KEY", "psysight-dev-secret-key")

    # Frontend origin (for CORS)
    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:8003")

    # Vision inference / model distribution
    VISION_MODEL_DIR = _resolve_path(os.getenv("VISION_MODEL_DIR", ""), BASE_DIR / "assets" / "models-cache")
    VISION_MODEL_DOWNLOAD_TIMEOUT_SECONDS = int(os.getenv("VISION_MODEL_DOWNLOAD_TIMEOUT_SECONDS", "180"))
    VISION_AUTO_DOWNLOAD_ENABLED = os.getenv("VISION_AUTO_DOWNLOAD_ENABLED", "true").lower() in {"1", "true", "yes", "on"}
    VISION_RELEASE_BASE_URL = os.getenv(
        "VISION_RELEASE_BASE_URL",
        "https://github.com/YouXiangyu/PsySight/releases/download/models-v1",
    )
    VISION_FACE_MODEL_URL = os.getenv("VISION_FACE_MODEL_URL", "")
    VISION_EXPR_MODEL_URL = os.getenv("VISION_EXPR_MODEL_URL", "")
    VISION_FACE_MODEL_SHA256 = os.getenv("VISION_FACE_MODEL_SHA256", "")
    VISION_EXPR_MODEL_SHA256 = os.getenv("VISION_EXPR_MODEL_SHA256", "")
    VISION_MAX_IMAGE_BYTES = int(os.getenv("VISION_MAX_IMAGE_BYTES", "1048576"))
