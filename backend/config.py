import os

class Config:
    # Gemini API Key
    GEMINI_API_KEY = "AIzaSyD8GcjwN24pJoUFnf4r7W3FwplKFNGT69s"
    
    # Database Configuration
    # 默认使用本地 MySQL，请根据实际情况修改
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'mysql+pymysql://root:password@localhost/psysight')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Flask Config
    SECRET_KEY = os.getenv('SECRET_KEY', 'psysight-secret-key-12345')
