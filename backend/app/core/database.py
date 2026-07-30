import sqlite3
import redis.asyncio as redis
import os
import logging
from typing import Dict, Any, Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger(__name__)

# 1. PostgreSQL Engine
Base = declarative_base()
try:
    engine = create_engine(settings.POSTGRES_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    logger.warning(f"PostgreSQL Connection deferred: {e}")
    SessionLocal = None

# 2. Redis Connection
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

# 3. SQLite Offline Seed DB Manager
SQLITE_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "peru_offline.db")

def init_sqlite_seed_db():
    """Inicializa la base de datos SQLite offline con los datos semilla de Perú."""
    os.makedirs(os.path.dirname(SQLITE_DB_PATH), exist_ok=True)
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    
    # Crear tablas
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS weather_data (
            city TEXT PRIMARY KEY,
            temperature REAL,
            humidity INTEGER,
            aqi INTEGER,
            condition TEXT,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS huaico_risks (
            city TEXT PRIMARY KEY,
            risk_percent INTEGER,
            risk_level TEXT,
            safe_zone_name TEXT,
            safe_zone_dist TEXT,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS minsa_guides (
            condition_id TEXT PRIMARY KEY,
            title TEXT,
            symptoms TEXT,
            treatment TEXT,
            urgency TEXT
        )
    """)

    # Insertar semillas iniciales
    cities = [
        ("Chosica", 22.5, 65, 42, "Parcialmente nublado"),
        ("Lima", 20.0, 78, 55, "Neblina"),
        ("Cusco", 14.2, 50, 18, "Soleado"),
        ("Huaraz", 16.0, 55, 22, "Despejado"),
        ("Piura", 29.0, 60, 35, "Caluroso")
    ]
    cursor.executemany("INSERT OR REPLACE INTO weather_data VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)", cities)

    huaicos = [
        ("Chosica", 85, "Alto", "I.E. 1234 - Nicolás de Piérola", "500m"),
        ("Lima", 15, "Bajo", "Estadio Nacional", "2km"),
        ("Cusco", 30, "Medio", "Plaza de Armas - Zona Alta", "800m"),
        ("Huaraz", 45, "Medio", "Colegio Santa Rosa", "600m"),
        ("Piura", 60, "Alto", "Universidad de Piura - Pabellón A", "1.2km")
    ]
    cursor.executemany("INSERT OR REPLACE INTO huaico_risks VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)", huaicos)

    guides = [
        ("dengue", "Guía Manejo Dengue MINSA", "Fiebre alta, dolor muscular, sarpullido", "Hidratación oral, paracetamol. NO ibuprofeno ni aspirina.", "Alta"),
        ("asma", "Guía Crisis Asmática MINSA", "Dificultad respiratoria, sibilancias", "Salbutamol inhalador 2-4 pufs. Buscar aire limpio.", "Media-Alta"),
        ("diarrea", "Guía Deshidratación Aguda", "Deposición líquida, sed, fatiga", "Sales de Rehidratación Oral (SRO) 1 litro en 24h.", "Media"),
        ("celulitis", "Guía Infección Cutánea MINSA", "Enrojecimiento, calor en piel, fiebre", "Compresas frías, atención médica inmediata para antibióticos.", "Alta")
    ]
    cursor.executemany("INSERT OR REPLACE INTO minsa_guides VALUES (?, ?, ?, ?, ?)", guides)

    conn.commit()
    conn.close()
    logger.info("SQLite Peru Offline DB initialized with seeds.")

def get_sqlite_weather(city: str) -> Optional[Dict[str, Any]]:
    try:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM weather_data WHERE city = ? COLLATE NOCASE", (city,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
    except Exception as e:
        logger.error(f"Error SQLite weather: {e}")
    return None

def get_sqlite_huaico(city: str) -> Optional[Dict[str, Any]]:
    try:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM huaico_risks WHERE city = ? COLLATE NOCASE", (city,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
    except Exception as e:
        logger.error(f"Error SQLite huaico: {e}")
    return None
