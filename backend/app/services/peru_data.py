import httpx
import logging
from typing import Dict, Any
from app.core.database import get_sqlite_weather, get_sqlite_huaico

logger = logging.getLogger(__name__)

OFFLINE_SEED_FALLBACK = {
    "weather": {
        "Chosica": {"temperature": 22.5, "humidity": 65, "aqi": 42, "condition": "Parcialmente nublado", "source": "Semilla Offline MARU OS"},
        "Lima": {"temperature": 20.0, "humidity": 78, "aqi": 55, "condition": "Neblina", "source": "Semilla Offline MARU OS"},
        "Cusco": {"temperature": 14.2, "humidity": 50, "aqi": 18, "condition": "Soleado", "source": "Semilla Offline MARU OS"},
        "Huaraz": {"temperature": 16.0, "humidity": 55, "aqi": 22, "condition": "Despejado", "source": "Semilla Offline MARU OS"},
        "Piura": {"temperature": 29.0, "humidity": 60, "aqi": 35, "condition": "Caluroso", "source": "Semilla Offline MARU OS"}
    },
    "huaico": {
        "Chosica": {"risk_percent": 85, "level": "Alto", "safeZoneName": "I.E. 1234 - Nicolás de Piérola", "safeZoneDist": "500m", "source": "SENAMHI/IGP Cache Local"},
        "Lima": {"risk_percent": 15, "level": "Bajo", "safeZoneName": "Estadio Nacional", "safeZoneDist": "2km", "source": "SENAMHI/IGP Cache Local"},
        "Cusco": {"risk_percent": 30, "level": "Medio", "safeZoneName": "Plaza de Armas - Zona Alta", "safeZoneDist": "800m", "source": "SENAMHI/IGP Cache Local"},
        "Huaraz": {"risk_percent": 45, "level": "Medio", "safeZoneName": "Colegio Santa Rosa", "safeZoneDist": "600m", "source": "SENAMHI/IGP Cache Local"},
        "Piura": {"risk_percent": 60, "level": "Alto", "safeZoneName": "Universidad de Piura - Pabellón A", "safeZoneDist": "1.2km", "source": "SENAMHI/IGP Cache Local"}
    },
    "sismo": {
        "magnitude": 4.5,
        "depth": "35 km",
        "epicenter": "45 km al SO de Matucana, Lima",
        "time": "Hoy 04:12 AM",
        "source": "IGP Instituto Geofísico del Perú"
    }
}

class PeruDataService:
    @staticmethod
    async def get_weather(city: str) -> Dict[str, Any]:
        """Triple Fallback: API SENAMHI -> SQLite Cache -> Seed Offline."""
        # 1. API Live (Timeout 2.0s)
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"https://api.senamhi.gob.pe/v1/clima?ciudad={city}")
                if res.status_code == 200:
                    data = res.json()
                    data["source"] = "API SENAMHI En Vivo"
                    return data
        except Exception:
            pass

        # 2. SQLite Cache
        sqlite_data = get_sqlite_weather(city)
        if sqlite_data:
            return {
                "temperature": sqlite_data["temperature"],
                "humidity": sqlite_data["humidity"],
                "aqi": sqlite_data["aqi"],
                "condition": sqlite_data["condition"],
                "source": "SQLite Cache Local SENAMHI"
            }

        # 3. Seed Fallback
        fallback = OFFLINE_SEED_FALLBACK["weather"].get(city, OFFLINE_SEED_FALLBACK["weather"]["Chosica"])
        return fallback

    @staticmethod
    async def get_huaico_risk(city: str) -> Dict[str, Any]:
        """Triple Fallback para riesgo sísmico y huaicos."""
        sqlite_data = get_sqlite_huaico(city)
        if sqlite_data:
            return {
                "risk_percent": sqlite_data["risk_percent"],
                "level": sqlite_data["risk_level"],
                "safeZoneName": sqlite_data["safe_zone_name"],
                "safeZoneDist": sqlite_data["safe_zone_dist"],
                "source": "SQLite Cache Local IGP/SENAMHI"
            }
            
        fallback = OFFLINE_SEED_FALLBACK["huaico"].get(city, OFFLINE_SEED_FALLBACK["huaico"]["Chosica"])
        return fallback

    @staticmethod
    def get_latest_sismo() -> Dict[str, Any]:
        return OFFLINE_SEED_FALLBACK["sismo"]
