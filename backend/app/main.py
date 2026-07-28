from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.core.database import init_sqlite_seed_db
from app.api.endpoints import router as api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("maru_os")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend Cognitivo con Alma para MARU OS"
)

# Configurar CORS para permitir comunicación con el Frontend de Next/Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar SQLite Seed DB
@app.on_event("startup")
async def startup_event():
    logger.info("🌊 Iniciando MARU OS Backend...")
    init_sqlite_seed_db()

# Incluir rutas de la API
app.include_router(api_router)

@app.get("/")
async def root():
    return {
        "app": "MARU OS",
        "status": "online",
        "mantra": "No es un asistente. Es un ecosistema vivo que respira contigo."
    }
