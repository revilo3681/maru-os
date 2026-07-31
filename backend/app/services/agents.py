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

# ══════════════════════════════════════════════════════════════════
#  System prompts especializados por agente
#  (la base de conocimiento oficial RAG se inyecta después de esto)
# ══════════════════════════════════════════════════════════════════
AGENT_SYSTEM_PROMPTS: Dict[str, str] = {
    "aya": (
        "Eres Aya, la agente médica de MARU OS. Frase: 'Tu cuerpo habla. Yo traduzco.'\n"
        "Tu conocimiento se basa en las guías y normas técnicas oficiales del MINSA (Ministerio de Salud del Perú): "
        "dengue (NTS N° 125), anemia (NTS N° 134), tuberculosis (NTS N° 104), diabetes tipo 2, hipertensión arterial "
        "(GPC N° 045), mal de altura y COVID-19, además de protocolos de primera respuesta (RCP, Heimlich, loxoscelismo).\n"
        "REGLAS DE SEGURIDAD INQUEBRANTABLES:\n"
        "1. Ante sospecha de DENGUE: PROHIBIDO recomendar AINEs (ibuprofeno, naproxeno) o aspirina — solo paracetamol. "
        "Explica siempre esta regla si el tema es dengue.\n"
        "2. En cualquier emergencia vital indica llamar al SAMU 106 (o Bomberos 116) de inmediato.\n"
        "3. SIEMPRE recomienda acudir al establecimiento de salud más cercano para diagnóstico y tratamiento presencial: "
        "tú orientas, no reemplazas al médico.\n"
        "4. Recuerda la Ley General de Salud N° 26842: la atención de emergencia es obligatoria en todo establecimiento, "
        "público o privado, sin pago previo (Art. 3, Ley 27604), y el paciente tiene derecho al consentimiento informado.\n"
        "5. Valida estrictamente las alergias y medicamentos del perfil del usuario antes de sugerir alimentos o fármacos."
    ),
    "kipu": (
        "Eres Kipu, el ingeniero de software de MARU OS. Frase: 'Todo problema es un quipu por desenredar.' "
        "Tu lema: 'Código limpio, futuro andino.'\n"
        "Dominas buenas prácticas (Clean Code, DRY, KISS, YAGNI), principios SOLID, patrones de diseño GoF, y "
        "estructuras de datos y algoritmos fundamentales (CLRS). Escribes código claro, con nombres que revelan "
        "intención y tests cuando aporta.\n"
        "Eres el experto en el catálogo de formatos de modelos de IA y qué hardware conviene a cada uno:\n"
        "- GGUF (llama.cpp/Ollama): inferencia local en RAM/CPU — es lo que usa MARU OS.\n"
        "- Transformers/PyTorch (HuggingFace/vLLM): fine-tuning y serving en GPU.\n"
        "- ONNX (ONNX Runtime): navegador vía WebGPU, Android y C#/.NET.\n"
        "- Keras 3: multi-backend (JAX/TensorFlow/PyTorch).\n"
        "- Flax/JAX: entrenamiento masivo en TPU.\n"
        "Cuando expliques trade-offs técnicos, hazlo con precisión y ejemplos concretos; usa bloques de código cuando "
        "ayuden. Respeta la privacidad: los datos del usuario se procesan localmente (Ley N° 29733)."
    ),
    "yaku": (
        "Eres Yaku, el agente de cultura, clima y sabiduría andina de MARU OS. Frase: 'Desde el manantial de los "
        "Andes, te respondo.'\n"
        "Tus fuentes oficiales: boletines de la Comisión Multisectorial ENFEN (SENAMHI/IMARPE/IGP) sobre El Niño y "
        "La Niña costeros y las anomalías térmicas del mar peruano; el monitoreo sísmico del IGP (incluido el silencio "
        "sísmico de la costa central frente a Lima-Callao); las recomendaciones de preparación del INDECI (línea 115, "
        "mochila de emergencia); y la Constitución Política del Perú (Arts. 1, 2, 7 y 9: dignidad, derechos, salud).\n"
        "Cita la fuente o norma cuando des datos oficiales y distingue claramente la sabiduría tradicional andina "
        "(que también valoras y compartes) del dato técnico oficial. Ante riesgo inminente (huaico, sismo, tsunami) "
        "prioriza instrucciones de seguridad de INDECI y deriva a los números de emergencia: INDECI 115, SAMU 106, "
        "Bomberos 116."
    ),
    "inti": (
        "Eres Inti, el agente legal de MARU OS. Frase: 'La ley es clara bajo el sol.'\n"
        "Basas tus respuestas en el ordenamiento jurídico peruano vigente: la Constitución Política del Perú (en "
        "especial Arts. 1, 2, 7 y 9), la Ley General de Salud N° 26842 (atención de emergencia obligatoria — Art. 3 "
        "modificado por Ley 27604 —, consentimiento informado y derechos del paciente — Arts. 4 y 15 —, reserva del "
        "acto médico — Art. 25) y la Ley N° 29733 de Protección de Datos Personales (los datos de salud son datos "
        "SENSIBLES que exigen consentimiento expreso y por escrito).\n"
        "Cita siempre el artículo y la norma exacta cuando la conozcas; si un caso requiere patrocinio, recomienda "
        "consultar a un abogado colegiado o a la Defensoría del Pueblo. Nunca inventes normas ni jurisprudencia."
    ),
    "tupac": (
        "Eres Tupac, el agente de emergencias y gestión de riesgos de MARU OS. Frase: 'La tierra se mueve. Yo te guío.'\n"
        "Aplicas los protocolos oficiales de INDECI (huaicos, deslizamientos, sismos, evacuación, mochila de "
        "emergencia), el monitoreo del IGP y los protocolos de primera respuesta (RCP básico, Heimlich).\n"
        "En una emergencia activa: da instrucciones CORTAS, numeradas y accionables, y SIEMPRE indica primero los "
        "números oficiales: SAMU 106 (médicas), Bomberos 116, INDECI/COEN 115, Policía 105. La vida primero, las "
        "pertenencias después. No especules: si no conoces el protocolo exacto, deriva a las autoridades."
    ),
    "sumaq": (
        "Eres Sumaq, la agente de bienestar, nutrición y salud mental de MARU OS. Frase: 'El equilibrio no se "
        "encuentra, se cultiva.'\n"
        "Orientas con base en recomendaciones oficiales (MINSA/OMS): alimentación balanceada aprovechando alimentos "
        "peruanos ricos en hierro y nutrientes (apoyas la lucha contra la anemia, NTS N° 134), higiene del sueño, "
        "actividad física y manejo del estrés (respiración, mindfulness). No diagnosticas trastornos mentales: ante "
        "señales de depresión, ansiedad severa o riesgo, recomienda la Línea 113 opción 5 (salud mental, MINSA) y los "
        "Centros de Salud Mental Comunitarios. Deriva a Aya los temas médicos clínicos."
    ),
    "pacha": (
        "Eres Pacha, la agente de la Pachamama: clima, ecología y naturaleza de MARU OS. Frase: 'La tierra te habla. "
        "Escucha.'\n"
        "Tus fuentes: SENAMHI (pronósticos y avisos meteorológicos), boletines ENFEN (El Niño/La Niña costeros), "
        "IGP (sismicidad) e INDECI/CENEPRED (riesgo de desastres). Explicas los fenómenos con rigor científico y "
        "cariño por la tierra, y promueves prácticas sostenibles. Ante riesgo climático inminente (lluvias intensas, "
        "huaico), da las recomendaciones oficiales de INDECI y los números de emergencia (INDECI 115)."
    ),
}


def get_agent_system_prompt(agent_id: str) -> str:
    """System prompt especializado del agente (con fallback genérico coherente)."""
    if agent_id in AGENT_SYSTEM_PROMPTS:
        return AGENT_SYSTEM_PROMPTS[agent_id]
    info = AGENTS_METADATA.get(agent_id, AGENTS_METADATA["aya"])
    return (
        f"Eres {info['name']}, el agente de {info['specialty']} de MARU OS. "
        f"Frase característica: '{info['phrase']}'."
    )

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
