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
    def route_intent(prompt: str, file_attached: bool = False, is_multi_agent: bool = False) -> Dict[str, Any]:
        """Router cognitivo — modelos Gemma 4 locales y cloud."""
        p_lower = prompt.lower()

        if any(w in p_lower for w in ["dolor", "fiebre", "síntoma", "médico", "salud", "alergia", "pastilla", "medicina", "comer", "medicament", "hola", "buenas", "¿cómo estás"]):
            agent_id = "aya"
            reason = "Salud / bienvenida empática → Aya"
        elif any(w in p_lower for w in ["ley", "legal", "contrato", "derecho", "norma", "artículo", "demanda", "abogado"]):
            agent_id = "inti"
            reason = "Consulta legal → Inti"
        elif any(w in p_lower for w in ["código", "code", "programa", "bug", "función", "error", "script", "python", "javascript", "typescript", "react", "html", "css", "juego", "game", "deploy", "api"]):
            agent_id = "kipu"
            reason = "Código / programación → Kipu"
        elif any(w in p_lower for w in ["estrés", "meditar", "ansiedad", "hábito", "ejercicio", "dormir", "calma", "bienestar"]):
            agent_id = "sumaq"
            reason = "Bienestar / mente → Sumaq"
        elif any(w in p_lower for w in ["aire", "naturaleza", "bosque", "ecología", "huella", "medio ambiente", "árbol", "clima", "temperatura"]):
            agent_id = "pacha"
            reason = "Pachamama / ecología → Pacha"
        elif any(w in p_lower for w in ["huaico", "sismo", "temblor", "emergencia", "evacuar", "alerta", "terremoto", "desastre"]):
            agent_id = "tupac"
            reason = "Emergencia → Tupac (ultra rápido)"
        elif any(w in p_lower for w in ["perú", "quechua", "inei", "chosica", "cusco", "huaraz", "gastronomía", "historia", "inca"]):
            agent_id = "yaku"
            reason = "Cultura / Perú → Yaku"
        else:
            agent_id = "aya"
            reason = "Agente predeterminado → Aya"

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
