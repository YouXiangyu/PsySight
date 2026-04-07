import os

from dotenv import load_dotenv

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
# 官方 API 常用名：deepseek-chat（对话）、deepseek-reasoner（推理）。
# 若控制台已开通 deepseek-v3.2 等名称，可在 .env 覆盖 DEEPSEEK_MODEL_FAST / THINK。
DEEPSEEK_MODEL_FAST = os.getenv("DEEPSEEK_MODEL_FAST", "deepseek-chat")
DEEPSEEK_MODEL_THINK = os.getenv("DEEPSEEK_MODEL_THINK", "deepseek-reasoner")
AI_TIMEOUT_SECONDS = int(os.getenv("AI_TIMEOUT_SECONDS", "60"))

FLASK_INTERNAL_URL = os.getenv("FLASK_INTERNAL_URL", "http://127.0.0.1:8004")
INTERNAL_API_TOKEN = os.getenv("INTERNAL_API_TOKEN", "psysight-internal-dev-token")

AGENT_HOST = os.getenv("AGENT_HOST", "0.0.0.0")
AGENT_PORT = int(os.getenv("AGENT_PORT", "8005"))

CHECKPOINTER_DB_PATH = os.getenv("CHECKPOINTER_DB_PATH", "agent_checkpoints.db")
