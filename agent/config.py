import os

from dotenv import load_dotenv

load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
DEEPSEEK_MODEL_FAST = os.getenv("DEEPSEEK_MODEL_FAST", "deepseek-v3.2")
DEEPSEEK_MODEL_THINK = os.getenv("DEEPSEEK_MODEL_THINK", "deepseek-v3.2-exp-think")
AI_TIMEOUT_SECONDS = int(os.getenv("AI_TIMEOUT_SECONDS", "60"))

FLASK_INTERNAL_URL = os.getenv("FLASK_INTERNAL_URL", "http://127.0.0.1:8004")
INTERNAL_API_TOKEN = os.getenv("INTERNAL_API_TOKEN", "psysight-internal-dev-token")

AGENT_HOST = os.getenv("AGENT_HOST", "0.0.0.0")
AGENT_PORT = int(os.getenv("AGENT_PORT", "8005"))

CHECKPOINTER_DB_PATH = os.getenv("CHECKPOINTER_DB_PATH", "agent_checkpoints.db")
