import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MARU OS Backend"
    VERSION: str = "1.0.0-cognitive"
    
    # DB Connections
    POSTGRES_URL: str = os.getenv("POSTGRES_URL", "postgresql://maru:marupassword@localhost:5432/maru_os")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    QDRANT_HOST: str = os.getenv("QDRANT_HOST", "localhost")
    QDRANT_PORT: int = int(os.getenv("QDRANT_PORT", "6333"))
    NEO4J_URI: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    NEO4J_USER: str = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "maruospassword")
    
    # Ollama Local Service
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
    
    # Backup Cloud Key
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    class Config:
        case_sensitive = True

settings = Settings()
