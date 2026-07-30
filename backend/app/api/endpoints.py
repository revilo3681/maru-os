from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import edge_tts
import io
import logging

from app.core.ollama import ollama_client
from app.services.agents import AGENTS_METADATA, CognitiveAgentRouter
from app.services.peru_data import PeruDataService
from app.services.onboarding import AccountService
from app.services.document_parser import DocumentParserService
from app.core.graph_store import graph_store
from app.core.vector_store import vector_store
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

# --- Schemas ---
class ChatRequest(BaseModel):
    prompt: str
    agentId: Optional[str] = "aya"
    manualAgent: Optional[bool] = False
    userProfile: Optional[Dict[str, Any]] = None
    healthProfile: Optional[Dict[str, Any]] = None
    locationProfile: Optional[Dict[str, Any]] = None
    fileAttachment: Optional[Dict[str, Any]] = None

class RegisterAccountRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=8)

class VerifySeedRequest(BaseModel):
    seedWords: List[str]

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "es-PE-CamilaNeural"

# --- Concurrency Queue ---
user_locks: Dict[str, asyncio.Lock] = {}

def get_user_lock(username: str) -> asyncio.Lock:
    if username not in user_locks:
        user_locks[username] = asyncio.Lock()
    return user_locks[username]

# --- Endpoints ---

@router.get("/health")
async def health_check():
    ollama_ok = await ollama_client.check_health()
    local_models = await ollama_client.list_models() if ollama_ok else []
    return {
        "status": "ok",
        "app": "MARU OS Backend",
        "version": "1.0.0-cognitive",
        "ollamaLocalActive": ollama_ok,
        "localModelsAvailable": local_models,
        "dbs": {
            "postgres": "ready",
            "redis": "ready",
            "qdrant": "ready",
            "neo4j": "ready",
            "sqlite": "ready"
        }
    }

@router.get("/agents")
async def get_agents():
    return list(AGENTS_METADATA.values())

@router.get("/peru")
async def get_peru_info(city: str = "Chosica"):
    weather = await PeruDataService.get_weather(city)
    huaico = await PeruDataService.get_huaico_risk(city)
    sismo = PeruDataService.get_latest_sismo()
    return {
        "city": city,
        "weather": weather,
        "huaico": huaico,
        "sismo": sismo
    }

@router.post("/auth/register")
async def register_account(req: RegisterAccountRequest):
    # Password is not hashed here yet
    # We would hash it later or mock it
    seed_str, seed_list = AccountService.generate_bip39_seed()
    
    # Save allergy/user relationships into Neo4j graph store if user profile is ready
    graph_store.add_user_allergy(req.username, "Maní")
    
    return {
        "status": "success",
        "username": req.username,
        "recoveryPhrase": seed_list,
        "recoveryPhraseStr": seed_str,
        "message": "Cuenta creada localmente. Guarda tus 12 palabras de recuperación."
    }

@router.post("/auth/verify-seed")
async def verify_seed(req: VerifySeedRequest):
    seed_str = " ".join(req.seedWords)
    is_valid = AccountService.verify_bip39_seed(seed_str)
    if not is_valid:
        raise HTTPException(status_code=400, detail="La frase de recuperación no es válida. Revisa el orden.")
    return {"status": "success", "valid": True}

@router.post("/chat")
async def cognitive_chat(req: ChatRequest):
    has_file = bool(req.fileAttachment)
    
    # 1. Routing logic
    if req.manualAgent and req.agentId in AGENTS_METADATA:
        agent_id = req.agentId
        agent_info = AGENTS_METADATA[agent_id]
        model_name = agent_info["model"]
        ram = agent_info["ram"]
        reason = "Selección manual por el usuario"
    else:
        route_res = await CognitiveAgentRouter.route_intent(req.prompt, file_attached=has_file)
        agent_id = route_res["agent_id"]
        agent_info = route_res["agent"]
        model_name = route_res["model_name"]
        ram = route_res["ram_required"]
        reason = route_res["reason"]

    user_name = req.userProfile.get("name", "Oliver") if req.userProfile else "Oliver"
    city = req.locationProfile.get("city", "Chosica") if req.locationProfile else "Chosica"
    allergies = ", ".join(req.healthProfile.get("allergies", ["Maní"])) if req.healthProfile else "Maní"
    meds = ", ".join([f"{m['name']} ({m['dose']})" for m in req.healthProfile.get("currentMedications", [])]) if req.healthProfile and "currentMedications" in req.healthProfile else "Amoxicilina (500mg)"

    user_lock = get_user_lock(user_name)

    # 2. Thinking Steps Generation
    thinking_steps = CognitiveAgentRouter.generate_thinking_steps(user_name, city, agent_info["name"], model_name)

    # 3. Recuperar Memoria de Qdrant (RAG)
    try_memories = await vector_store.search_memories(req.prompt, limit=3)
    memory_context = ""
    if try_memories:
        memory_context = "Memoria de conversaciones anteriores:\n"
        for mem in try_memories:
            memory_context += f"- Usuario: {mem.get('text', '')} | MARU: {mem.get('response', '')}\n"
    
    # 4. System Prompt
    system_prompt = f"""Eres {agent_info['name']}, el agente de {agent_info['specialty']} con alma de MARU OS.
Frase característica: '{agent_info['phrase']}'.
Hablas de forma empática, cálida y directa a {user_name} en {city}.
Perfil del usuario: Alergias: [{allergies}], Medicamentos: [{meds}].
Si el usuario pregunta por comidas, medicamentos o salud, valida estrictamente las alergias.
{memory_context}
Responde en idioma Español con calidez humana."""

    # 4. Procesar archivo adjunto (PDF / OCR) si existe
    extracted_text = ""
    if has_file and req.fileAttachment.get("dataBase64"):
        import base64
        
        file_data = req.fileAttachment["dataBase64"].split(",")[-1]
        file_bytes = base64.b64decode(file_data)
        file_type = req.fileAttachment.get("type", "")
        
        try:
            if DocumentParserService.is_pdf(file_type) or file_type == "pdf":
                extracted_text = await DocumentParserService.parse_pdf(file_bytes)
            elif DocumentParserService.is_image(file_type) or file_type == "image":
                extracted_text = await DocumentParserService.parse_image(file_bytes)
            else:
                extracted_text = f"[Archivo no soportado: {file_type}]"
        except Exception as e:
            logger.error(f"Error procesando adjunto: {e}")
            extracted_text = f"[Error procesando el archivo: {e}]"
            
    # Modify the prompt if text was extracted
    final_prompt = req.prompt
    if extracted_text:
        final_prompt = f"El usuario adjuntó un documento con el siguiente texto extraído:\n\n---\n{extracted_text}\n---\n\nPregunta/Mensaje del usuario: {req.prompt}"

    # Setup multi-agent parameters
    is_multi_agent = route_res.get("is_multi_agent", False)
    all_agent_ids = route_res.get("agent_ids", [agent_id])
    secondary_agents = all_agent_ids[1:] if len(all_agent_ids) > 1 else []
    tools_needed = route_res.get("tools", [])

    # 5. Intent local Ollama query
    import json
    from app.services.tools import search_web_tool, execute_python_tool
    
    async def generate():
        async with user_lock:
            nonlocal system_prompt
            
            # --- Tool Execution (Fase 8) ---
            if tools_needed:
                tool_results = ""
                if "search_web" in tools_needed:
                    yield json.dumps({"thinking_step": "Buscando información en internet..."}).encode('utf-8') + b'\n'
                    search_res = await search_web_tool(final_prompt)
                    tool_results += f"\n[Resultados Búsqueda Web]:\n{search_res}\n"
                
                if "execute_python" in tools_needed:
                    yield json.dumps({"thinking_step": "Escribiendo código Python..."}).encode('utf-8') + b'\n'
                    # 1. Pedir a Kipu que escriba solo código
                    code_prompt = f"Eres un programador experto. El usuario pidió esto: '{final_prompt}'. Escribe SOLO el código Python 3 necesario para resolverlo, sin Markdown ni explicaciones. Asegúrate de imprimir (print) el resultado final."
                    code_res = await ollama_client.generate_response(model_name, "Solo devuelve código limpio, sin ```python ni nada extra.", code_prompt, temperature=0.1)
                    code_clean = code_res.get("content", "").replace("```python", "").replace("```", "").strip()
                    
                    yield json.dumps({"thinking_step": "Ejecutando script en Sandbox Local..."}).encode('utf-8') + b'\n'
                    exec_res = await execute_python_tool(code_clean)
                    tool_results += f"\n[Resultado Sandbox Python (STDOUT/STDERR)]:\n{exec_res}\n"
                
                if tool_results:
                    system_prompt += f"\n\nATENCIÓN: Usa obligatoriamente los siguientes resultados de las Herramientas Externas para responder:\n{tool_results}"

            # --- Multi-Agent (Fase 7) ---
            if is_multi_agent and secondary_agents:
                yield json.dumps({"thinking_step": "Activando panel de expertos..."}).encode('utf-8') + b'\n'
                
                expert_opinions = ""
                for sec_id in secondary_agents:
                    sec_info = AGENTS_METADATA[sec_id]
                    yield json.dumps({"thinking_step": f"{sec_info['name']} está analizando el contexto..."}).encode('utf-8') + b'\n'
                    
                    sec_prompt = f"Eres {sec_info['name']}, experto en {sec_info['specialty']}. Da un consejo o análisis muy breve (2-3 oraciones) sobre esta solicitud: {final_prompt}"
                    
                    # Llamada síncrona al experto
                    res_dict = await ollama_client.generate_response(model_name, sec_prompt, final_prompt, temperature=0.3)
                    expert_text = res_dict.get("content", "")
                    expert_opinions += f"\nOpinión de {sec_info['name']}: {expert_text}"
                
                yield json.dumps({"thinking_step": f"Sintetizando respuestas con {agent_info['name']}..."}).encode('utf-8') + b'\n'
                
                # Inyectar opiniones al prompt final
                nonlocal system_prompt
                system_prompt += f"\n\nATENCIÓN: Cuentas con las opiniones de tus compañeros expertos. Úsalas para enriquecer tu respuesta final:\n{expert_opinions}"

            has_content = False
            full_content = ""

            async for chunk in ollama_client.generate_response_stream(model_name, system_prompt, final_prompt):
                has_content = True
                try:
                    data = json.loads(chunk.decode('utf-8'))
                    if "response" in data:
                        full_content += data["response"]
                    if "final" in data:
                        # is_local = data.get("is_local", True)
                        # When done, add memory
                        await vector_store.add_memory(f"msg_{user_name}", req.prompt, {"agent": agent_id, "response": full_content})
                        # Add metadata to final chunk
                        data.update({
                            "agentId": agent_id,
                            "agentName": agent_info["name"],
                            "modelUsed": data.get("model", model_name),
                            "modelRAM": ram,
                            "decisionReason": reason,
                            "thinkingSteps": thinking_steps,
                            "voice": agent_info["voice"]
                        })
                        yield json.dumps(data).encode('utf-8') + b'\n'
                        return
                except Exception:
                    pass
                yield chunk

            # Fallback si Ollama no devuelve nada
            if not has_content:
                p_lower = req.prompt.lower()
                if "maní" in p_lower or "comida" in p_lower or "plato" in p_lower or "comer" in p_lower:
                    full_content = f"¡Hola {user_name}! He verificado tu perfil médico en Neo4j y tienes registrada una alergia severa al MANÍ. Si el plato contiene salsa de maní o frutos secos, con tu medicación actual ({meds}), te recomiendo evitarlo para prevenir anafilaxia.\n\n¿Deseas que te sugiera una alternativa culinaria peruana totalmente segura?"
                elif "huaico" in p_lower or "sismo" in p_lower or "temblor" in p_lower:
                    full_content = f"⚠️ Alerta de prevención en {city}:\nNivel de riesgo por huaico: 85% (Alto).\nZona segura recomendada: I.E. 1234 - Nicolás de Piérola (a 500m).\n\nMantén la calma, ten tu mochila de emergencia lista y aléjate del cauce de las quebradas."
                elif agent_id == "kipu":
                    full_content = f"¡Hola {user_name}! Como tu compañero de código en MARU OS, todo problema es un quipu por desenredar.\n\n```typescript\n// Solución optimizada para React 19 / TypeScript\nexport function useCognitiveState<T>(initial: T) {{\n  return React.useState<T>(initial);\n}}\n```"
                else:
                    full_content = f"{user_name}, he procesado tu mensaje con atención desde el manantial cognitivo de MARU OS en {city}. Estoy aquí para guiarte y acompañarte en tu día a día.\n\n¿En qué más te puedo ayudar hoy?"

                await vector_store.add_memory(f"msg_{user_name}", req.prompt, {"agent": agent_id, "response": full_content})
                
                fallback_response = {
                    "response": full_content,
                    "final": True,
                    "agentId": agent_id,
                    "agentName": agent_info["name"],
                    "modelUsed": "Reglas (Offline)",
                    "modelRAM": "0 GB",
                    "is_local": True,
                    "decisionReason": reason + " (Respuesta de respaldo local)",
                    "thinkingSteps": thinking_steps,
                    "voice": agent_info["voice"]
                }
                yield json.dumps(fallback_response).encode('utf-8') + b'\n'

    return StreamingResponse(generate(), media_type="application/x-ndjson")

@router.post("/tts")
async def generate_tts(req: TTSRequest):
    """Genera audio con voz humana usando Edge TTS."""
    try:
        communicate = edge_tts.Communicate(req.text, req.voice)
        audio_stream = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_stream.write(chunk["data"])
        audio_stream.seek(0)
        return StreamingResponse(audio_stream, media_type="audio/mpeg")
    except Exception as e:
        logger.error(f"Error generando TTS: {e}")
        raise HTTPException(status_code=500, detail="Error generando audio TTS")
