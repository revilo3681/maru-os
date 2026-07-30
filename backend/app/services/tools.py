import logging
import subprocess
import asyncio

logger = logging.getLogger(__name__)

async def search_web_tool(query: str, max_results: int = 3) -> str:
    """Busca en internet usando DuckDuckGo de manera asíncrona (en un hilo)."""
    try:
        from duckduckgo_search import DDGS
        
        def _sync_search():
            results_text = ""
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=max_results))
                if not results:
                    return "No se encontraron resultados en internet."
                for i, r in enumerate(results):
                    results_text += f"\n[Resultado {i+1}]: {r.get('title', '')} - {r.get('body', '')}"
            return results_text

        # Ejecutar en un hilo para no bloquear el loop
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, _sync_search)
        return result
    except ImportError:
        logger.error("duckduckgo-search no instalado.")
        return "Error: Herramienta de búsqueda no instalada."
    except Exception as e:
        logger.error(f"Error en búsqueda web: {e}")
        return f"Error buscando en la web: {str(e)}"

async def execute_python_tool(code: str, timeout: int = 5) -> str:
    """Ejecuta código Python en un sandbox temporal (subprocess) y devuelve la salida."""
    try:
        # Sanitización básica
        if "import os" in code or "import sys" in code or "subprocess" in code or "shutil" in code:
            return "❌ Bloqueado por seguridad: El código intenta usar librerías de sistema prohibidas."

        def _sync_exec():
            # Ejecutamos con timeout
            result = subprocess.run(
                ['python3', '-c', code],
                capture_output=True,
                text=True,
                timeout=timeout
            )
            output = ""
            if result.stdout:
                output += f"--- STDOUT ---\n{result.stdout}\n"
            if result.stderr:
                output += f"--- STDERR ---\n{result.stderr}\n"
            
            if not output:
                output = "El script se ejecutó correctamente pero no imprimió nada (stdout vacío)."
            return output

        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, _sync_exec)
        return result

    except subprocess.TimeoutExpired:
        return f"❌ Error: El script tardó más de {timeout} segundos y fue cancelado (Timeout)."
    except Exception as e:
        logger.error(f"Error ejecutando python: {e}")
        return f"❌ Error de ejecución: {str(e)}"
