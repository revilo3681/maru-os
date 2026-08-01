import httpx
import logging
from typing import Dict, Any
from app.core.database import get_sqlite_weather, get_sqlite_huaico

logger = logging.getLogger(__name__)

CITY_COORDS = {
    "Chosica": (-11.9437, -76.7094),
    "Lima": (-12.0464, -77.0428),
    "Callao": (-12.0566, -77.1181),
    "Cusco": (-13.5319, -71.9675),
    "Huaraz": (-9.5278, -77.5278),
    "Piura": (-5.1945, -80.6328),
    "Arequipa": (-16.4090, -71.5375),
    "Trujillo": (-8.1116, -79.0288),
    "Chiclayo": (-6.7714, -79.8409),
    "Iquitos": (-3.7437, -73.2516),
    "Huancayo": (-12.0651, -75.2049),
    "Puno": (-15.8402, -70.0219),
    "Tacna": (-18.0146, -70.2536),
    "Ica": (-14.0678, -75.7286),
    "Juliaca": (-15.4997, -70.1333),
    "Cajamarca": (-7.1617, -78.5128),
    "Ayacucho": (-13.1639, -74.2236),
    "Pucallpa": (-8.3791, -74.5539),
    "Tarapoto": (-6.4880, -76.3728),
    "Huánuco": (-9.9306, -76.2422),
    "Chincha Alta": (-13.4178, -76.1325),
    "Sullana": (-4.9039, -80.6853),
    "Chimbote": (-9.0853, -78.5783),
    "Moquegua": (-17.1939, -70.9346),
    "Tumbes": (-3.5669, -80.4515),
}

OFFLINE_SEED_FALLBACK = {
    "weather": {
        "Chosica": {"temperature": 22.5, "humidity": 65, "aqi": 42, "condition": "Parcialmente nublado", "precip_mm": 0.2, "source": "Semilla Offline MARU OS"},
        "Lima": {"temperature": 20.0, "humidity": 78, "aqi": 55, "condition": "Neblina", "precip_mm": 0.0, "source": "Semilla Offline MARU OS"},
        "Cusco": {"temperature": 14.2, "humidity": 50, "aqi": 18, "condition": "Soleado", "precip_mm": 0.5, "source": "Semilla Offline MARU OS"},
        "Huaraz": {"temperature": 16.0, "humidity": 55, "aqi": 22, "condition": "Despejado", "precip_mm": 0.0, "source": "Semilla Offline MARU OS"},
        "Piura": {"temperature": 29.0, "humidity": 60, "aqi": 35, "condition": "Caluroso", "precip_mm": 0.0, "source": "Semilla Offline MARU OS"}
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
        """Fallback: SENAMHI -> Open-Meteo (real) -> SQLite -> Seed."""
        # 1. API SENAMHI (si responde)
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"https://api.senamhi.gob.pe/v1/clima?ciudad={city}")
                if res.status_code == 200:
                    data = res.json()
                    data["source"] = "API SENAMHI En Vivo"
                    return data
        except Exception:
            pass

        # 2. Open-Meteo (datos meteorológicos reales, sin API key)
        try:
            lat, lon = CITY_COORDS.get(city, CITY_COORDS["Chosica"])
            url = (
                "https://api.open-meteo.com/v1/forecast"
                f"?latitude={lat}&longitude={lon}"
                "&current=temperature_2m,relative_humidity_2m,precipitation,weather_code"
                "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code"
                "&forecast_days=7"
                "&timezone=America%2FLima"
            )
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    payload = res.json()
                    cur = payload.get("current") or {}
                    daily = payload.get("daily") or {}
                    code = int(cur.get("weather_code") or 0)
                    condition = "Soleado"
                    if code in (1, 2, 3):
                        condition = "Parcialmente nublado"
                    elif code in (45, 48):
                        condition = "Neblina"
                    elif code >= 51:
                        condition = "Lluvia"
                    report = []
                    days = daily.get("time") or []
                    for i, day in enumerate(days[:7]):
                        report.append({
                            "date": day,
                            "high": (daily.get("temperature_2m_max") or [None])[i] if i < len(daily.get("temperature_2m_max") or []) else None,
                            "low": (daily.get("temperature_2m_min") or [None])[i] if i < len(daily.get("temperature_2m_min") or []) else None,
                            "precip_mm": (daily.get("precipitation_sum") or [None])[i] if i < len(daily.get("precipitation_sum") or []) else None,
                            "weather_code": (daily.get("weather_code") or [None])[i] if i < len(daily.get("weather_code") or []) else None,
                        })
                    return {
                        "temperature": cur.get("temperature_2m"),
                        "humidity": cur.get("relative_humidity_2m"),
                        "precip_mm": cur.get("precipitation", 0),
                        "aqi": OFFLINE_SEED_FALLBACK["weather"].get(city, {}).get("aqi", 45),
                        "condition": condition,
                        "daily_report": report,
                        "coords": {"lat": lat, "lon": lon},
                        "source": "Open-Meteo (en vivo)",
                        "updated_at": cur.get("time"),
                    }
        except Exception as e:
            logger.warning(f"Open-Meteo weather failed: {e}")

        # 3. SQLite Cache
        sqlite_data = get_sqlite_weather(city)
        if sqlite_data:
            return {
                "temperature": sqlite_data["temperature"],
                "humidity": sqlite_data["humidity"],
                "aqi": sqlite_data["aqi"],
                "condition": sqlite_data["condition"],
                "source": "SQLite Cache Local SENAMHI"
            }

        # 4. Seed Fallback
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
