import httpx
import logging
from typing import Dict, Any, Optional, List
from app.core.config import settings

logger = logging.getLogger(__name__)

# Los 4 modelos Gemma del usuario
# MLX corren en Metal GPU pero requieren fallback a cloud si el runner falla
GEMMA_MODELS = {
    "gemma4:e4b-mlx":   {"ram": "8.8 GB", "type": "Local MLX", "role": "Cerebro principal"},
    "gemma4:12b-mlx":   {"ram": "7.7 GB", "type": "Local MLX", "role": "Visión & Código"},
    "gemma4:e2b-mlx":   {"ram": "6.5 GB", "type": "Local MLX", "role": "Ultra rápido"},
    "gemma4:31b-cloud": {"ram": "Cloud",  "type": "Cloud",     "role": "Máxima capacidad"},
}

CANDIDATE_URLS = [
    "http://host.docker.internal:11434",
    "http://172.17.0.1:11434",
    settings.OLLAMA_BASE_URL,
]

class OllamaClient:
    def __init__(self):
        self.active_url: Optional[str] = None

    async def get_working_url(self) -> Optional[str]:
        if self.active_url:
            try:
                async with httpx.AsyncClient(timeout=1.5) as client:
                    res = await client.get(f"{self.active_url}/api/tags")
                    if res.status_code == 200:
                        return self.active_url
            except Exception:
                self.active_url = None

        for url in CANDIDATE_URLS:
            try:
                async with httpx.AsyncClient(timeout=2.0) as client:
                    res = await client.get(f"{url}/api/tags")
                    if res.status_code == 200:
                        self.active_url = url
                        logger.info(f"✅ Ollama conectado en: {url}")
                        return url
            except Exception:
                continue
        return None

    async def check_health(self) -> bool:
        return bool(await self.get_working_url())

    async def list_models(self) -> List[Dict[str, Any]]:
        url = await self.get_working_url()
        if not url:
            return []
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{url}/api/tags")
                if res.status_code == 200:
                    return res.json().get("models", [])
        except Exception as e:
            logger.warning(f"Error listando modelos: {e}")
        return []

    async def generate_response(
        self,
        model: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Genera respuesta con un modelo Gemma.
        Si el modelo MLX falla (error de arquitectura), hace fallback automático a gemma4:31b-cloud.
        """
        url = await self.get_working_url()
        if not url:
            return {"content": "", "done": False, "model": model, "is_local": False,
                    "error": "Ollama no disponible"}

        # Secuencia de intento: modelo pedido → gemma4:31b-cloud como respaldo
        models_to_try = [model]
        if model != "gemma4:31b-cloud":
            models_to_try.append("gemma4:31b-cloud")

        for attempt_model in models_to_try:
            payload = {
                "model": attempt_model,
                "system": system_prompt,
                "prompt": user_prompt,
                "temperature": temperature,
                "stream": False
            }
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    res = await client.post(f"{url}/api/generate", json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        content = data.get("response", "").strip()
                        if content:
                            is_local = "mlx" in attempt_model.lower()
                            if attempt_model != model:
                                logger.info(f"⚠️ {model} falló → usando {attempt_model} como respaldo")
                            return {
                                "content": content,
                                "done": True,
                                "model": attempt_model,
                                "is_local": is_local,
                                "url_used": url
                            }
                    else:
                        err = res.text[:200]
                        logger.warning(f"❌ {attempt_model} → status {res.status_code}: {err}")
                        if "mlx runner failed" in err or "unsupported architecture" in err:
                            logger.info(f"→ Modelo MLX no soportado, intentando fallback...")
                            continue  # intentar el siguiente
            except Exception as e:
                logger.error(f"Error con {attempt_model}: {e}")
                continue

        return {"content": "", "done": False, "model": model, "is_local": False,
                "error": "Todos los modelos Gemma fallaron"}

ollama_client = OllamaClient()
