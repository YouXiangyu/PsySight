import os

class Config:
    # Mimo API Configuration (Anthropic Compatible)
    MIMO_API_KEY = "sk-crryec67twraqwq7fg0qej82o25yqaozitpt4xng47qk75qb"
    MIMO_BASE_URL = "https://api.xiaomimimo.com/anthropic"
    MIMO_MODEL = "mimo-v2-flash"
    
    # DeepSeek API Configuration (OpenAI Compatible)
    DEEPSEEK_API_KEY = "sk-59259a15d43c403588b9507cefd5ec5d"
    DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"
    DEEPSEEK_MODEL = "deepseek-chat"
    
    # Database Configuration
    SQLALCHEMY_DATABASE_URI = 'sqlite:///psysight.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Flask Config
    SECRET_KEY = os.getenv('SECRET_KEY', 'psysight-secret-key-12345')
