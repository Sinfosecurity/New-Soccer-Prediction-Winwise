from typing import Any, Dict, List, Optional, Union
from pydantic import AnyHttpUrl, BaseSettings, EmailStr, HttpUrl, PostgresDsn, validator
import secrets
from pathlib import Path
import os

class Settings(BaseSettings):
    # Project Info
    PROJECT_NAME: str = "Soccer Prediction Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    SERVER_NAME: str = "WinWise"
    SERVER_HOST: AnyHttpUrl = "http://localhost"
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",  # Vite default port
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175"
    ]

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database Configuration
    DATABASE_URL: str = "sqlite:///./soccer_predictions.db"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = "winwise"
    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None

    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql",
            user=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            path=f"/{values.get('POSTGRES_DB') or ''}",
        )

    # External APIs Configuration
    FOOTBALL_API_URL: HttpUrl = "https://api.football-data.org/v2"
    FOOTBALL_API_KEY: str = ""
    ODDS_API_URL: HttpUrl = "https://api.the-odds-api.com/v4"
    ODDS_API_KEY: str = ""
    WEATHER_API_URL: HttpUrl = "https://api.weatherapi.com/v1"
    WEATHER_API_KEY: str = ""

    # Machine Learning Configuration
    MODEL_PATH: Path = Path("app/ml/models/prediction_model.joblib")
    MIN_MATCHES_FOR_TRAINING: int = 50
    FEATURE_COLUMNS: List[str] = [
        'home_team_rating',
        'away_team_rating',
        'home_form_points',
        'away_form_points',
        'home_goals_scored_avg',
        'home_goals_conceded_avg',
        'away_goals_scored_avg',
        'away_goals_conceded_avg',
        'head_to_head_home_wins',
        'head_to_head_away_wins',
        'home_win_streak',
        'away_win_streak',
        'home_rest_days',
        'away_rest_days',
        'is_derby',
        'is_neutral_venue',
        'weather_temperature',
        'weather_precipitation'
    ]

    # Prediction Configuration
    MIN_CONFIDENCE_THRESHOLD: float = 0.6
    MAX_STAKE_PERCENTAGE: float = 0.1
    SIGNIFICANT_ODDS_MOVEMENT_THRESHOLD: float = 0.15

    # Email Configuration
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[EmailStr] = None
    EMAILS_FROM_NAME: Optional[str] = None

    @validator("EMAILS_FROM_NAME")
    def get_project_name(cls, v: Optional[str], values: Dict[str, Any]) -> str:
        if not v:
            return values["SERVER_NAME"]
        return v

    # Notification Configuration
    ENABLE_NOTIFICATIONS: bool = True
    NOTIFICATION_CHANNELS: List[str] = ["email", "push"]
    
    # Performance Configuration
    CACHE_TTL: int = 300  # 5 minutes
    MAX_CONNECTIONS: int = 10
    TIMEOUT: int = 60

    # AI Models Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    OPENAI_TEMPERATURE: float = 0.3
    OPENAI_MAX_TOKENS: int = 1000
    
    DEEPSEEK_API_URL: str = "https://api.deepseek.com/v1"
    DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    DEEPSEEK_MODEL: str = "deepseek-chat"
    DEEPSEEK_TEMPERATURE: float = 0.3
    DEEPSEEK_MAX_TOKENS: int = 1000
    
    # AI Prediction Settings
    AI_PREDICTION_ENABLED: bool = True
    AI_CONFIDENCE_THRESHOLD: float = 0.7
    AI_ENSEMBLE_WEIGHTS: Dict[str, float] = {
        "gpt4": 0.6,
        "deepseek": 0.4
    }
    AI_UPDATE_INTERVAL: int = 300  # 5 minutes
    
    # Model Combination Settings
    USE_AI_ENSEMBLE: bool = True
    STATISTICAL_MODEL_WEIGHT: float = 0.7
    AI_MODEL_WEIGHT: float = 0.3
    MIN_MODEL_AGREEMENT: float = 0.8  # Minimum agreement threshold between models

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings() 