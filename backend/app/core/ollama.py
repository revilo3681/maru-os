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

import asyncio
import json

class OllamaClient:
    def __init__(self):
        self.active_url: Optional[str] = None
        self.queue_lock = asyncio.Lock()

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

    async def generate_response_stream(
        self,
        model: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7
    ):
        """
        Genera respuesta usando un candado (queue) para evitar que peticiones concurrentes
        crasheen la GPU M4. Y yield los chunks NDJSON.
        """
        url = await self.get_working_url()
        if not url:
            yield json.dumps({"error": "Ollama no disponible"}).encode('utf-8') + b'\n'
            return

        models_to_try = [model]
        if model != "gemma4:31b-cloud":
            models_to_try.append("gemma4:31b-cloud")

        async with self.queue_lock:
            for attempt_model in models_to_try:
                payload = {
                    "model": attempt_model,
                    "system": system_prompt,
                    "prompt": user_prompt,
                    "temperature": temperature,
                    "stream": True
                }
                try:
                    async with httpx.AsyncClient(timeout=120.0) as client:
                        async with client.stream("POST", f"{url}/api/generate", json=payload) as res:
                            if res.status_code == 200:
                                async for chunk in res.aiter_lines():
                                    if chunk.strip():
                                        yield chunk.encode('utf-8') + b'\n'
                                        
                                        # Parse and check if done
                                        try:
                                            data = json.loads(chunk)
                                            if data.get("done"):
                                                final_payload = {
                                                    "final": True,
                                                    "model": attempt_model,
                                                    "is_local": "cloud" not in attempt_model.lower(),
                                                    "url_used": url
                                                }
                                                yield json.dumps(final_payload).encode('utf-8') + b'\n'
                                        except:
                                            pass
                                return
                            else:
                                err = (await res.aread()).decode('utf-8')[:200]
                                logger.warning(f"❌ {attempt_model} → status {res.status_code}: {err}")
                                if "mlx runner failed" in err or "unsupported architecture" in err or "500" in str(res.status_code):
                                    logger.info(f"→ Error, intentando fallback...")
                                    continue
                except Exception as e:
                    logger.error(f"Error con {attempt_model}: {e}")
                    continue

            yield json.dumps({"error": "Todos los modelos Gemma fallaron"}).encode('utf-8') + b'\n'

    async def generate_response(
        self,
        model: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """Backward compatibility for single generation."""
        content = ""
        final_data = {}
        async for chunk in self.generate_response_stream(model, system_prompt, user_prompt, temperature):
            try:
                data = json.loads(chunk.decode('utf-8'))
                if "response" in data:
                    content += data["response"]
                if "final" in data:
                    final_data = data
            except:
                pass
        return {
            "content": content,
            "done": True,
            "model": final_data.get("model", model),
            "is_local": final_data.get("is_local", False)
        }

ollama_client = OllamaClient()
