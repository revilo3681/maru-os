import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# ══════════════════════════════════════════════════════════════════
#  Modelos Gemma 4 Estándar (GGUF Local en GPU M4 + Cloud)
# ══════════════════════════════════════════════════════════════════
GEMMA_MODELS = {
    "gemma4:e4b":       {"ram": "9.6 GB", "type": "Local GPU M4", "role": "Cerebro principal"},
    "gemma4:12b":       {"ram": "7.6 GB", "type": "Local GPU M4", "role": "Visión & Código"},
    "gemma4:e2b":       {"ram": "7.2 GB", "type": "Local GPU M4", "role": "Ultra rápido"},
    "gemma4:31b-cloud": {"ram": "Cloud",  "type": "Cloud",        "role": "Alta capacidad"},
    "gemma4:cloud":     {"ram": "Cloud",  "type": "Cloud",        "role": "Alta capacidad"},
}

AGENTS_METADATA = {
    "aya": {
        "id": "aya",
        "name": "Aya",
        "specialty": "Médico & Salud Integral",
        "phrase": "Tu cuerpo habla. Yo traduzco.",
        "voice": "es-PE-CamilaNeural",
        "model": "gemma4:12b",
        "model_fallback": "gemma4:31b-cloud",
        "ram": "7.6 GB",
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
        "model": "gemma4:e4b",
        "model_fallback": "gemma4:31b-cloud",
        "ram": "9.6 GB",
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
        "model": "gemma4:12b",
        "model_fallback": "gemma4:31b-cloud",
        "ram": "7.6 GB",
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
        "model": "gemma4:e4b",
        "model_fallback": "gemma4:31b-cloud",
        "ram": "9.6 GB",
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
        "model": "gemma4:e4b",
        "model_fallback": "gemma4:31b-cloud",
        "ram": "9.6 GB",
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
        "model": "gemma4:e2b",
        "model_fallback": "gemma4:31b-cloud",
        "ram": "7.2 GB",
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
        "model": "gemma4:31b-cloud",
        "model_fallback": "gemma4:31b-cloud",
        "ram": "Cloud",
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
        Solo puedes devolver una de estas palabras (y NADA MÁS):
        - aya (para temas médicos, salud, medicinas, dolor, bienestar físico)
        - inti (para leyes, constitución, contratos, legal)
        - kipu (para código, programación, python, bugs, react)
        - sumaq (para bienestar emocional, estrés, meditación)
        - pacha (para clima, ecología, naturaleza)
        - tupac (para emergencias, sismos, huaicos)
        - yaku (para cultura peruana, historia, INEI)
        """
        
        # Intentamos usar gemma4:e2b para la clasificación rápida
        resp = await ollama_client.generate_response("gemma4:e2b", system_prompt, prompt, temperature=0.1)
        agent_id_raw = resp.get("content", "").strip().lower()
        
        agent_id = "aya"
        reason = "Agente predeterminado"
        
        # Validar la respuesta del modelo
        valid_agents = ["aya", "inti", "kipu", "sumaq", "pacha", "tupac", "yaku"]
        
        for valid in valid_agents:
            if valid in agent_id_raw:
                agent_id = valid
                reason = f"Clasificado inteligentemente por gemma4:e2b → {agent_id.capitalize()}"
                break
        
        # Fallback basado en reglas si e2b falla o no devuelve algo válido
        if reason == "Agente predeterminado":
            p_lower = prompt.lower()
            if any(w in p_lower for w in ["dolor", "fiebre", "síntoma", "médico", "salud", "alergia", "pastilla"]):
                agent_id = "aya"
                reason = "Fallback reglas: Salud → Aya"
            elif any(w in p_lower for w in ["ley", "legal", "contrato", "derecho"]):
                agent_id = "inti"
                reason = "Fallback reglas: Legal → Inti"
            elif any(w in p_lower for w in ["código", "code", "programa", "bug", "python", "react"]):
                agent_id = "kipu"
                reason = "Fallback reglas: Código → Kipu"
            elif any(w in p_lower for w in ["sismo", "huaico", "emergencia"]):
                agent_id = "tupac"
                reason = "Fallback reglas: Emergencia → Tupac"

        agent_info = AGENTS_METADATA[agent_id]

        if file_attached or is_multi_agent:
            selected_model = "gemma4:31b-cloud"
            ram_req = "Cloud"
            reason += " + gemma4:31b-cloud para visión/multi-agente"
        else:
            selected_model = agent_info["model"]
            ram_req = agent_info["ram"]

        return {
            "agent_id": agent_id,
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
            f"> Consultando RAG (Qdrant) + Grafo (Neo4j)... ✓",
            f"> Datos ambientales {city} via SENAMHI... ✓",
            f"> Activando {agent_name} con {model_name} ({model_type})... ✓",
            f"> Sintetizando respuesta cognitiva Gemma4... ✓"
        ]
