from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    SQLALCHEMY_DATABASE_URL: str = "mysql+pymysql://root:2221@localhost:3306/chat_app"
    SECRET_KEY: str = "supersecretkey"  # Change to a secure value in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

settings = Settings() 