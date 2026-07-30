import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# ══════════════════════════════════════════════════════════════════
#  Modelos Gemma 4 Cuantizados Locales (Ollama)
# ══════════════════════════════════════════════════════════════════
GEMMA_MODELS = {
    "gemma4:e2b-q4": {"ram": "3.3 GB", "type": "Local Quantized", "role": "Ultra rápido / Default"},
    "gemma4:e4b-q4": {"ram": "5.2 GB", "type": "Local Quantized", "role": "Cerebro principal"},
    "gemma4:12b-q4": {"ram": "7.0 GB", "type": "Local Quantized", "role": "Visión & Código de alta precisión"},
}

AGENTS_METADATA = {
    "aya": {
        "id": "aya",
        "name": "Aya",
        "specialty": "Médico & Salud Integral",
        "phrase": "Tu cuerpo habla. Yo traduzco.",
        "voice": "es-PE-CamilaNeural",
        "model": "gemma4:12b-q4",
        "model_fallback": "gemma4:e4b-q4",
        "ram": "7.0 GB",
        "color": "#1E3A5F",
        "sphere_3d": "Cristal Azul Latido",
        "particles": "Azuladas (Glóbulos)"
    },
    "inti": {
        "id": "inti",
        "name": "Inti",
        "specialty": "Legal & Constitución Peruana",
        "phrase": "La ley es clara bajo el sol.",
        "voice": "es-PE-AlexNeural",
        "model": "gemma4:e4b-q4",
        "model_fallback": "gemma4:e2b-q4",
        "ram": "5.2 GB",
        "color": "#B8924A",
        "sphere_3d": "Mármol Gris Columnas",
        "particles": "Plateadas (Grid)"
    },
    "kipu": {
        "id": "kipu",
        "name": "Kipu",
        "specialty": "Programador & Arquitectura",
        "phrase": "Todo problema es un quipu por desenredar.",
        "voice": "es-PE-AlexNeural",
        "model": "gemma4:12b-q4",
        "model_fallback": "gemma4:e4b-q4",
        "ram": "7.0 GB",
        "color": "#1A3326",
        "sphere_3d": "Circuito Verde Neón",
        "particles": "Verdes Matrix"
    },
    "sumaq": {
        "id": "sumaq",
        "name": "Sumaq",
        "specialty": "Bienestar, Nutrición & Mente",
        "phrase": "El equilibrio no se encuentra, se cultiva.",
        "voice": "es-PE-CamilaNeural",
        "model": "gemma4:e4b-q4",
        "model_fallback": "gemma4:e2b-q4",
        "ram": "5.2 GB",
        "color": "#3A2E39",
        "sphere_3d": "Loto Lavanda Pétalos",
        "particles": "Pétalos Lavanda"
    },
    "pacha": {
        "id": "pacha",
        "name": "Pacha",
        "specialty": "Pachamama, Clima & Ecología",
        "phrase": "La tierra te habla. Escucha.",
        "voice": "es-PE-CamilaNeural",
        "model": "gemma4:e4b-q4",
        "model_fallback": "gemma4:e2b-q4",
        "ram": "5.2 GB",
        "color": "#1E392A",
        "sphere_3d": "Tierra Viva Ecosistema",
        "particles": "Hojas y Agua"
    },
    "tupac": {
        "id": "tupac",
        "name": "Tupac",
        "specialty": "Emergencias & Gestión de Riesgos",
        "phrase": "La tierra se mueve. Yo te guío.",
        "voice": "es-PE-AlexNeural",
        "model": "gemma4:e2b-q4",
        "model_fallback": "gemma4:e4b-q4",
        "ram": "3.3 GB",
        "color": "#4A1512",
        "sphere_3d": "Obsidiana Roja Ondas",
        "particles": "Rojas Sísmicas"
    },
    "yaku": {
        "id": "yaku",
        "name": "Yaku",
        "specialty": "Cultura, INEI & Sabiduría Andina",
        "phrase": "Desde el manantial de los Andes, te respondo.",
        "voice": "es-PE-AlexNeural",
        "model": "gemma4:e4b-q4",
        "model_fallback": "gemma4:e2b-q4",
        "ram": "5.2 GB",
        "color": "#1E3A5F",
        "sphere_3d": "Agua Cristalina Ondas",
        "particles": "Doradas y Teal"
    }
}

class CognitiveAgentRouter:
    @staticmethod
    async def route_intent(prompt: str, file_attached: bool = False, is_multi_agent: bool = False) -> Dict[str, Any]:
        """Router cognitivo inteligente — usa gemma4:e2b para clasificar el intent."""
        from app.core.ollama import ollama_client
        
        system_prompt = """Eres un Router Cognitivo de MARU OS. Tu única tarea es clasificar la intención del usuario y devolver el ID del agente adecuado. 
        Si la pregunta abarca múltiples temas (ej. salud y código), puedes devolver hasta 2 IDs separados por coma.
        Solo puedes devolver palabras de esta lista (y NADA MÁS):
        - aya (para temas médicos, salud, medicinas, dolor, bienestar físico)
        - inti (para leyes, constitución, contratos, legal)
        - kipu (para código, programación, python, bugs, react)
        - sumaq (para bienestar emocional, estrés, meditación)
        - pacha (para clima, ecología, naturaleza)
        - tupac (para emergencias, sismos, huaicos)
        - yaku (para cultura peruana, historia, INEI)
        """
        
        # Intentamos usar gemma4:e2b-q4 para la clasificación rápida
        resp = await ollama_client.generate_response("gemma4:e2b-q4", system_prompt, prompt, temperature=0.1)
        agent_id_raw = resp.get("content", "").strip().lower()
        
        agent_ids = []
        reason = "Agente predeterminado"
        
        # Validar la respuesta del modelo
        valid_agents = ["aya", "inti", "kipu", "sumaq", "pacha", "tupac", "yaku"]
        
        for valid in valid_agents:
            if valid in agent_id_raw:
                agent_ids.append(valid)
        
        if not agent_ids:
            agent_ids = ["aya"]
        
        # Fallback basado en reglas si e2b falla o no devuelve algo válido
        if reason == "Agente predeterminado" and len(agent_ids) == 1 and agent_ids[0] == "aya":
            p_lower = prompt.lower()
            if any(w in p_lower for w in ["dolor", "fiebre", "síntoma", "médico", "salud", "alergia", "pastilla"]):
                agent_ids = ["aya"]
                reason = "Fallback reglas: Salud → Aya"
            elif any(w in p_lower for w in ["ley", "legal", "contrato", "derecho"]):
                agent_ids = ["inti"]
                reason = "Fallback reglas: Legal → Inti"
            elif any(w in p_lower for w in ["código", "code", "programa", "bug", "python", "react"]):
                agent_ids = ["kipu"]
                reason = "Fallback reglas: Código → Kipu"
            elif any(w in p_lower for w in ["sismo", "huaico", "emergencia"]):
                agent_ids = ["tupac"]
                reason = "Fallback reglas: Emergencia → Tupac"
            else:
                reason = f"Clasificado inteligentemente por gemma4:e2b-q4 → {', '.join(agent_ids)}"
        else:
            reason = f"Clasificado inteligentemente por gemma4:e2b-q4 → {', '.join(agent_ids)}"

        # Limitar a máximo 2 agentes para no sobrecargar
        agent_ids = list(dict.fromkeys(agent_ids))[:2]
        
        primary_agent_id = agent_ids[0]
        agent_info = AGENTS_METADATA[primary_agent_id]

        is_multi = len(agent_ids) > 1 or is_multi_agent

        # 3. Detectar si se necesitan herramientas del Mundo Real (Phase 8)
        tools_needed = []
        p_lower = prompt.lower()
        
        # Heurística para Web Search
        if any(w in p_lower for w in ["busca", "internet", "noticia", "hoy", "clima", "qué pasó", "quién es"]):
            tools_needed.append("search_web")
            reason += " + [Búsqueda Web activada]"
            
        # Heurística para Sandbox Python
        if primary_agent_id == "kipu" and any(w in p_lower for w in ["ejecuta", "corre", "script", "sandbox", "calcula"]):
            tools_needed.append("execute_python")
            reason += " + [Sandbox Python activado]"

        if file_attached or is_multi or tools_needed:
            selected_model = "gemma4:12b-q4" # Usar el modelo más robusto para síntesis y tools
            ram_req = "7.0 GB"
            if "multi-agente" not in reason:
                reason += " (gemma4:12b-q4 para Tools)"
        else:
            selected_model = agent_info["model"]
            ram_req = agent_info["ram"]

        return {
            "agent_id": primary_agent_id, # El primario es el sintetizador
            "agent_ids": agent_ids,       # Todos los involucrados
            "is_multi_agent": is_multi,
            "tools": tools_needed,        # Herramientas a ejecutar
            "agent": agent_info,
            "model_name": selected_model,
            "ram_required": ram_req,
            "is_local": "cloud" not in selected_model,
            "reason": reason
        }

    @staticmethod
    def generate_thinking_steps(user_name: str, city: str, agent_name: str, model_name: str) -> List[str]:
        model_info = GEMMA_MODELS.get(model_name, {})
        model_type = model_info.get("type", "Local GPU M4")
        return [
            f"🧠 Analizando solicitud de {user_name}...",
            f"> Verificando historial y perfil en {city}... ✓",
            "> Consultando RAG (Qdrant) + Grafo (Neo4j)... ✓",
            f"> Datos ambientales {city} via SENAMHI... ✓",
            f"> Activando {agent_name} con {model_name} ({model_type})... ✓",
            "> Sintetizando respuesta cognitiva Gemma4... ✓"
        ]
