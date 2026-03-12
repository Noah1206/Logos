from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # API Keys
    OPENAI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # Redis (for queue)
    REDIS_URL: str = "redis://localhost:6379"

    # Instagram 우회
    PROXY_URL: str = ""  # 주거용 프록시 (예: socks5://user:pass@host:port)
    RAPIDAPI_KEY: str = ""  # RapidAPI Instagram Downloader 키

    # App Settings
    TEMP_DIR: str = "./temp"
    MAX_VIDEO_DURATION: int = 180  # 3분 (쇼츠/릴스 최대)
    MAX_STUDY_DURATION: int = 3600  # 1시간 (Study 모드 장편 영상)

    # OpenAI Settings
    WHISPER_MODEL: str = "whisper-1"
    GPT_MODEL: str = "gpt-4o"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
