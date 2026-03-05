import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # DeepSeek API Configuration
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
    DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-reasoner")
    AI_TIMEOUT_SECONDS = int(os.getenv("AI_TIMEOUT_SECONDS", "60"))

    # Admin export capability
    ADMIN_EXPORT_TOKEN = os.getenv("ADMIN_EXPORT_TOKEN", "")

    # Database Configuration
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///psysight.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Flask Config
    SECRET_KEY = os.getenv("SECRET_KEY", "psysight-dev-secret-key")

    # Frontend origin (for CORS)
    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:8003")
