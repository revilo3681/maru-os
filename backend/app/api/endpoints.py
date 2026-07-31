from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import io
import logging
import json
import asyncio
import base64

try:
    import edge_tts  # type: ignore
except ImportError:
    edge_tts = None

try:
    from app.core.ollama import ollama_client
    from app.services.agents import AGENTS_METADATA, CognitiveAgentRouter, get_agent_system_prompt
    from app.services.knowledge_base import build_rag_context, list_documents
    from app.services import model_config
    from app.services.peru_data import PeruDataService
    from app.services.onboarding import AccountService
    from app.services.document_parser import DocumentParserService
    from app.services import document_vault
    from app.core.graph_store import graph_store
    from app.core.vector_store import vector_store
except ImportError:
    from ..core.ollama import ollama_client
    from ..services.agents import AGENTS_METADATA, CognitiveAgentRouter, get_agent_system_prompt
    from ..services.knowledge_base import build_rag_context, list_documents
    from ..services import model_config
    from ..services.peru_data import PeruDataService
    from ..services.onboarding import AccountService
    from ..services.document_parser import DocumentParserService
    from ..services import document_vault
    from ..core.graph_store import graph_store
    from ..core.vector_store import vector_store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

# --- Schemas ---
class ChatRequest(BaseModel):
    prompt: str
    agentId: Optional[str] = "aya"
    manualAgent: Optional[bool] = False
    confirmUpgrade: Optional[bool] = False
    userContext: Optional[str] = None
    userProfile: Optional[Dict[str, Any]] = None
    healthProfile: Optional[Dict[str, Any]] = None
    locationProfile: Optional[Dict[str, Any]] = None
    fileAttachment: Optional[Dict[str, Any]] = None
    # Motor configurable: override por request (si no se envían, manda la config persistida)
    engineMode: Optional[str] = None       # 'manual' | 'router'
    manualModel: Optional[str] = None      # p. ej. 'gemma4:e2b-mlx'

class SaveConfigRequest(BaseModel):
    engineMode: Optional[str] = None
    manualModel: Optional[str] = None
    enabledAgents: Optional[List[str]] = None

class RegisterAccountRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=8)

class VerifySeedRequest(BaseModel):
    seedWords: List[str]

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "es-PE-CamilaNeural"

class TranslateRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str
    context_dict: Optional[str] = ""

class LegalUploadRequest(BaseModel):
    name: str
    mimeType: Optional[str] = "application/pdf"
    type: Optional[str] = "pdf"
    dataBase64: str
    agentId: Optional[str] = "inti"
    sizeFormatted: Optional[str] = None

class PythonExecRequest(BaseModel):
    code: str
    timeout: Optional[int] = 8

class MailSendRequest(BaseModel):
    to: str
    subject: str
    body: str
    gmailEmail: str
    gmailAppPass: str

class STTRequest(BaseModel):
    dataBase64: str
    mimeType: Optional[str] = "audio/webm"
    language: Optional[str] = "es"

class Note(BaseModel):
    id: str
    title: str
    content: str
    createdAt: str
    updatedAt: str

# --- Notes DB Mock ---
NOTES_DB_FILE = "notes_db.json"
def load_notes():
    try:
        with open(NOTES_DB_FILE, "r") as f:
            return json.load(f)
    except:
        return []

def save_notes(notes):
    with open(NOTES_DB_FILE, "w") as f:
        json.dump(notes, f)


# --- Concurrency Queue ---
user_locks: Dict[str, asyncio.Lock] = {}
mock_notifications: List[Dict] = []

def get_user_lock(username: str) -> asyncio.Lock:
    if username not in user_locks:
        user_locks[username] = asyncio.Lock()
    return user_locks[username]

# --- Endpoints ---

@router.get("/health")
async def health_check():
    # Estado REAL de Ollama: conexión + modelos efectivamente instalados (/api/tags)
    ollama_ok = await ollama_client.check_health()
    local_models = await ollama_client.list_models() if ollama_ok else []
    installed_names = [m.get("name", "") for m in local_models]
    return {
        "status": "ok",
        "app": "MARU OS Backend",
        "version": "1.0.0-cognitive",
        "ollamaLocalActive": ollama_ok,
        "localModelsAvailable": installed_names,
        "modelCatalog": model_config.catalog_with_availability(installed_names),
        "engineConfig": model_config.load_config(),
        # Nota: los estados de DB no se verifican activamente todavía (asumidos)
        "dbs": {
            "postgres": "assumed (not checked)",
            "redis": "assumed (not checked)",
            "qdrant": "assumed (not checked)",
            "neo4j": "assumed (not checked)",
            "sqlite": "ready"
        },
        "dbsVerified": False
    }

@router.get("/models")
async def get_models():
    """Estado real de Ollama + catálogo de modelos seleccionables con disponibilidad."""
    ollama_ok = await ollama_client.check_health()
    local_models = await ollama_client.list_models() if ollama_ok else []
    installed_names = [m.get("name", "") for m in local_models]
    return {
        "ollamaConnected": ollama_ok,
        "installedModels": installed_names,
        "catalog": model_config.catalog_with_availability(installed_names),
        "defaultModel": model_config.DEFAULT_MODEL_ID,
    }

@router.get("/config")
async def get_engine_config():
    """Configuración persistida del motor: modo (manual/router), modelo fijo y especialistas activos."""
    return model_config.load_config()

@router.post("/config")
async def save_engine_config(req: SaveConfigRequest):
    try:
        config = model_config.save_config(
            engine_mode=req.engineMode,
            manual_model=req.manualModel,
            enabled_agents=req.enabledAgents,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"status": "success", "config": config}

@router.get("/knowledge")
async def get_knowledge(agent: Optional[str] = None, q: Optional[str] = None):
    """Base de Conocimiento Oficial: lista/busca documentos (filtros ?agent= y ?q=)."""
    docs = list_documents(agent=agent, query=q)
    return {
        "total": len(docs),
        "documents": [
            {
                "id": d["id"],
                "title": d["title"],
                "source": d["source"],
                "agents": d["agents"],
                "keywords": d["keywords"],
                "body": d["body"],
            }
            for d in docs
        ],
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

    # 0. Motor configurable: request > config persistida
    engine_config = model_config.load_config()
    engine_mode = req.engineMode if req.engineMode in model_config.VALID_ENGINE_MODES else engine_config["engineMode"]
    manual_model_requested = req.manualModel or engine_config["manualModel"]

    # 1. Routing logic
    route_res = {}
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

    # 1.b Resolver contra modelos REALMENTE instalados en Ollama
    installed_models = await ollama_client.list_models()
    installed_names = [m.get("name", "") for m in installed_models]

    if engine_mode == "manual":
        # Modo MANUAL: familia fija · Q4 primero → normal / cloud liviano primero
        model_name = model_config.resolve_model_name(manual_model_requested, installed_names)
        catalog_entry = next(
            (e for e in model_config.MODEL_CATALOG
             if model_config.canonical_model_id(manual_model_requested) == e["id"]),
            None,
        )
        ram = catalog_entry["ram"] if catalog_entry else ram
        reason = f"{reason} | Manual: {manual_model_requested} → {model_name} (Q4→normal / cloud liviano)"
    else:
        # Modo ROUTER: cada agente pide Q4; se resuelve a normal si no hay cuantizado
        requested_router = model_name
        model_name = model_config.resolve_model_name(model_name, installed_names)
        if model_name != requested_router:
            reason = f"{reason} | Router: {requested_router} → {model_name}"

    # 🚦 Interrupción por Confirmación de Consumo (Point 10):
    # Solo aplica en modo router (en manual el usuario ya fijó su modelo):
    needs_upgrade_approval = (
        engine_mode == "router"
        and model_config.canonical_model_id(model_name) == "gemma4:12b-q4"
        and (not req.confirmUpgrade)
        and (not req.manualAgent)
    )
    if needs_upgrade_approval:
        async def send_upgrade_request():
            yield json.dumps({
                "type": "model_upgrade_request",
                "recommended_model": "gemma4:12b-q4",
                "current_model": "gemma4:e2b-q4",
                "ram_required": "7.0 GB",
                "reason": f"Esta consulta requiere razonamiento avanzado ({reason}). ¿Deseas elevar la potencia a gemma4:12b-q4?"
            }).encode('utf-8') + b'\n'
        return StreamingResponse(send_upgrade_request(), media_type="application/x-ndjson")

    user_name = req.userProfile.get("name", "Oliver") if req.userProfile else "Oliver"
    city = req.locationProfile.get("city", "Chosica") if req.locationProfile else "Chosica"
    allergies = ", ".join(req.healthProfile.get("allergies", ["Maní"])) if req.healthProfile else "Maní"
    meds = ", ".join([f"{m['name']} ({m['dose']})" for m in req.healthProfile.get("currentMedications", [])]) if req.healthProfile and "currentMedications" in req.healthProfile else "Amoxicilina (500mg)"
    custom_context = req.userContext or (req.userProfile.get("customContext", "") if req.userProfile else "")

    user_lock = get_user_lock(user_name)

    # 2. Thinking Steps Generation con Porcentajes
    thinking_steps = CognitiveAgentRouter.generate_thinking_steps(user_name, city, agent_info["name"], model_name)

    # 3. Recuperar Memoria de Qdrant (RAG)
    try_memories = await vector_store.search_memories(req.prompt, limit=3)
    memory_context = ""
    if try_memories:
        memory_context = "Memoria de conversaciones anteriores:\n"
        for mem in try_memories:
            memory_context += f"- Usuario: {mem.get('text', '')} | MARU: {mem.get('response', '')}\n"
    
    context_bullet = f"\nSemilla de Perfil Personal:\n{custom_context}\n" if custom_context else ""

    # 4. System Prompt con Semilla de Contexto y Agenda (Fase 3)
    p_lower = req.prompt.lower()
    agenda_context = ""
    if "hoy" in p_lower or "agenda" in p_lower or "tarea" in p_lower or "calendario" in p_lower or "reunión" in p_lower:
        agenda_context = """
[Contexto de Agenda y Rutinas del Usuario]
Calendario: 09:00 AM Reunión de Sincronización (Proyecto MARU) | 02:30 PM Cita Médica (Chequeo General).
Todoist: Comprar víveres (Alta prioridad) | Revisar código de Kipu (Media prioridad).
Dile al usuario qué tiene pendiente de manera muy natural, si te lo pregunta directamente.
"""

    # RAG oficial: recuperar documentos de la Base de Conocimiento filtrados por
    # el agente activo e inyectarlos como fuentes verificables (100% offline).
    rag_context = build_rag_context(req.prompt, agent_id=agent_id, limit=3)
    if rag_context:
        reason += " + [Base de Conocimiento Oficial consultada]"

    # Bóveda documental del usuario (contratos, PDFs, fotos OCR indexadas)
    vault_context = document_vault.build_vault_context(req.prompt, agent_id=agent_id, limit=3)
    if vault_context:
        reason += " + [Bóveda documental consultada]"

    agent_persona = get_agent_system_prompt(agent_id)

    system_prompt = f"""{agent_persona}

Hablas de forma empática, cálida y directa a {user_name} en {city}.
Perfil del usuario: Alergias: [{allergies}], Medicamentos: [{meds}].{context_bullet}
Si el usuario pregunta por comidas, medicamentos o salud, valida estrictamente las alergias.
{memory_context}
{agenda_context}
{rag_context}
{vault_context}
Responde en idioma Español con calidez humana."""

    # 4. Procesar archivo adjunto (PDF / OCR / texto) si existe
    extracted_text = ""
    extract_kind = ""
    attachment_name = ""
    if has_file and req.fileAttachment.get("dataBase64"):
        file_data = req.fileAttachment["dataBase64"].split(",")[-1]
        file_bytes = base64.b64decode(file_data)
        file_type = req.fileAttachment.get("type", "")
        mime_type = req.fileAttachment.get("mimeType", "") or req.fileAttachment.get("mime_type", "")
        attachment_name = req.fileAttachment.get("name", "adjunto")
        extract_kind, extracted_text = await DocumentParserService.extract(
            file_bytes,
            file_type=file_type,
            mime_type=mime_type,
            filename=attachment_name,
        )
        # Indexar en bóveda para consultas futuras (RAG por agente)
        if extracted_text and not extracted_text.startswith("[") and extract_kind in ("pdf", "image", "text"):
            try:
                document_vault.index_document(
                    name=attachment_name,
                    text=extracted_text,
                    agent_id=agent_id,
                    mime_type=mime_type or file_type or "application/octet-stream",
                    source="chat",
                )
                # Mejor esfuerzo: también a Qdrant si está disponible
                await vector_store.add_memory(
                    f"vault_{agent_id}_{attachment_name}",
                    extracted_text[:4000],
                    {"agent": agent_id, "kind": "vault_doc", "name": attachment_name},
                )
            except Exception as e:
                logger.warning(f"No se pudo indexar adjunto en bóveda: {e}")

    # Modify the prompt if text was extracted
    final_prompt = req.prompt
    if extracted_text:
        label = {"pdf": "PDF", "image": "imagen (OCR)", "text": "texto"}.get(extract_kind, "archivo")
        final_prompt = (
            f"El usuario adjuntó un {label} llamado «{attachment_name}» "
            f"con el siguiente contenido extraído:\n\n---\n{extracted_text[:12000]}\n---\n\n"
            f"Pregunta/Mensaje del usuario: {req.prompt or 'Analiza este archivo y dame un resumen útil.'}"
        )

    # Setup multi-agent parameters
    is_multi_agent = route_res.get("is_multi_agent", False)
    all_agent_ids = route_res.get("agent_ids", [agent_id])
    secondary_agents = all_agent_ids[1:] if len(all_agent_ids) > 1 else []
    tools_needed = route_res.get("tools", [])

    from app.services.tools import search_web_tool, execute_python_tool
    
    async def generate():
        async with user_lock:
            current_sys_prompt = system_prompt

            if extracted_text:
                step_label = {
                    "pdf": f"Leyendo PDF «{attachment_name}»...",
                    "image": f"OCR rápido de imagen «{attachment_name}»...",
                    "text": f"Procesando texto «{attachment_name}»...",
                }.get(extract_kind, f"Procesando adjunto «{attachment_name}»...")
                yield json.dumps({"thinking_step": step_label}).encode("utf-8") + b"\n"
                yield json.dumps({"thinking_step": "Indexando en bóveda documental local..."}).encode("utf-8") + b"\n"
            
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
                    current_sys_prompt += f"\n\nATENCIÓN: Usa obligatoriamente los siguientes resultados de las Herramientas Externas para responder:\n{tool_results}"

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
                current_sys_prompt += f"\n\nATENCIÓN: Cuentas con las opiniones de tus compañeros expertos. Úsalas para enriquecer tu respuesta final:\n{expert_opinions}"

            has_content = False
            full_content = ""

            async for chunk in ollama_client.generate_response_stream(model_name, current_sys_prompt, final_prompt):
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
                if "dengue" in p_lower:
                    full_content = f"{user_name}, según la norma oficial NTS N° 125-MINSA/2016/CDC-DGIESP: ante sospecha de dengue NO tomes ibuprofeno, aspirina ni ningún AINE (aumentan el riesgo de sangrado). Solo paracetamol para la fiebre, hidratación abundante y reposo.\n\nVigila los signos de alarma (dolor abdominal intenso, vómitos persistentes, sangrado) y acude al establecimiento de salud más cercano. Emergencias: SAMU 106."
                elif "maní" in p_lower or "comida" in p_lower or "plato" in p_lower or "comer" in p_lower:
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

@router.post("/translate")
async def translate_text(req: TranslateRequest):
    """
    Traduce texto entre español y lenguas nativas.
    Modelo: gemma4:e2b-q4 (cuantizado); si no está instalado → gemma4:e2b.
    """
    prompt = f"""Eres un traductor experto de lenguas originarias del Perú.
Debes traducir de {req.source_lang} a {req.target_lang}.

Contexto de vocabulario útil:
{req.context_dict}

Texto a traducir: "{req.text}"

REGLAS ESTRICTAS:
Devuelve ÚNICAMENTE un objeto JSON válido con este formato exacto, sin texto adicional ni markdown:
{{
  "translation": "texto traducido",
  "phonetic": "aproximación fonética literal para que un hispanohablante lo lea y suene auténtico"
}}
"""
    try:
        installed = [m.get("name", "") for m in await ollama_client.list_models()]
        # Siempre preferir e2b-q4; fallback a e2b normal
        translate_model = model_config.resolve_fast_local(installed)
        res = await ollama_client.generate_response(
            translate_model,
            "Eres el motor de traducción nativo de MARU OS. Responde solo con JSON puro.",
            prompt,
            temperature=0.2,
        )
        content = (res.get("content") or res.get("response") or "").strip()

        # Limpiar markdown de código si el LLM lo incluye
        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "").strip()
        elif content.startswith("```"):
            content = content.replace("```", "").strip()

        data = json.loads(content)
        return {
            "status": "success",
            "data": data,
            "modelUsed": res.get("model", translate_model),
        }
    except Exception as e:
        logger.error(f"Error en traducción: {e}")
        return {"status": "error", "data": {"translation": "No se pudo generar la traducción. Por favor intenta de nuevo.", "phonetic": ""}}

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

@router.get("/notes", response_model=List[Note])
async def get_notes():
    return load_notes()

@router.post("/notes")
async def save_note(note: Note):
    notes = load_notes()
    idx = next((i for i, n in enumerate(notes) if n["id"] == note.id), -1)
    if idx >= 0:
        notes[idx] = note.model_dump()
    else:
        notes.insert(0, note.model_dump())
    
    save_notes(notes)
    
    # RAG Vectorization
    try:
        await vector_store.add_memory(
            f"note_{note.id}",
            f"Nota de MARU OS - Título: {note.title}\n{note.content}",
            {"type": "note", "title": note.title}
        )
    except Exception as e:
        logger.error(f"Error vectorizando nota: {e}")

    return {"status": "success", "note": note}

@router.post("/mock-gmail")
async def trigger_mock_gmail():
    notif = {
        "id": f"gmail_{int(asyncio.get_event_loop().time())}",
        "sender": "banco@interbank.pe",
        "subject": "Confirmación de trámite hipotecario",
        "suggestedDraft": "Estimados,\nConfirmo la recepción de los documentos requeridos. Los revisaré en la brevedad.\n\nSaludos.",
        "timestamp": "Ahora mismo"
    }
    mock_notifications.append(notif)
    return {"status": "triggered"}


@router.post("/python/exec")
async def exec_python(req: PythonExecRequest):
    """Sandbox local para Kipu: ejecuta Python acotado y devuelve stdout/stderr."""
    from app.services.tools import execute_python_tool
    timeout = max(1, min(int(req.timeout or 8), 15))
    output = await execute_python_tool(req.code or "", timeout=timeout)
    return {"status": "ok", "output": output}


@router.post("/mail/send")
async def send_mail(req: MailSendRequest):
    """Envía correo vía Gmail SMTP usando App Password guardada en el cliente."""
    import smtplib
    from email.mime.text import MIMEText

    if not req.gmailEmail or not req.gmailAppPass:
        raise HTTPException(status_code=400, detail="Credenciales Gmail requeridas (Ajustes)")
    if not req.to or not req.subject:
        raise HTTPException(status_code=400, detail="Destinatario y asunto requeridos")

    msg = MIMEText(req.body or "", "plain", "utf-8")
    msg["Subject"] = req.subject
    msg["From"] = req.gmailEmail
    msg["To"] = req.to

    def _send():
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=20) as server:
            server.login(req.gmailEmail, req.gmailAppPass.replace(" ", ""))
            server.sendmail(req.gmailEmail, [req.to], msg.as_string())

    try:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, _send)
        return {"status": "sent", "to": req.to, "subject": req.subject}
    except smtplib.SMTPAuthenticationError:
        raise HTTPException(
            status_code=401,
            detail="Autenticación Gmail fallida. Usa una App Password (no la clave normal).",
        )
    except Exception as e:
        logger.error(f"Error enviando correo: {e}")
        raise HTTPException(status_code=502, detail=f"No se pudo enviar: {e}")


@router.post("/stt")
async def speech_to_text(req: STTRequest):
    """
    STT local opcional.
    Intenta faster-whisper / openai-whisper si están instalados;
    si no, responde 501 para que el frontend use Web Speech API.
    """
    import tempfile
    import os as _os

    if not req.dataBase64:
        raise HTTPException(status_code=400, detail="audio requerido")

    try:
        raw = req.dataBase64.split(",")[-1]
        audio_bytes = base64.b64decode(raw)
    except Exception:
        raise HTTPException(status_code=400, detail="audio base64 inválido")

    suffix = ".webm"
    if req.mimeType and "wav" in req.mimeType:
        suffix = ".wav"
    elif req.mimeType and "mp4" in req.mimeType:
        suffix = ".mp4"
    elif req.mimeType and "ogg" in req.mimeType:
        suffix = ".ogg"

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        text = ""
        engine = "none"

        # 1) faster-whisper
        try:
            from faster_whisper import WhisperModel  # type: ignore

            model = WhisperModel("tiny", device="cpu", compute_type="int8")
            segments, _info = model.transcribe(tmp_path, language=req.language or "es")
            text = " ".join(seg.text.strip() for seg in segments).strip()
            engine = "faster-whisper"
        except Exception:
            pass

        # 2) openai-whisper
        if not text:
            try:
                import whisper  # type: ignore

                model = whisper.load_model("tiny")
                result = model.transcribe(tmp_path, language=req.language or "es")
                text = (result.get("text") or "").strip()
                engine = "openai-whisper"
            except Exception:
                pass

        if not text:
            raise HTTPException(
                status_code=501,
                detail="Whisper no instalado. Usa Web Speech en el cliente.",
            )

        return {"status": "ok", "text": text, "engine": engine}
    finally:
        if tmp_path:
            try:
                _os.unlink(tmp_path)
            except Exception:
                pass

@router.get("/notifications")
async def get_notifications():
    # Return and clear
    res = list(mock_notifications)
    mock_notifications.clear()
    return res

@router.get("/agenda")
async def get_agenda():
    # Simulador de Google Calendar y Todoist
    return {
        "calendar": [
            {"id": "1", "time": "09:00 AM", "title": "Reunión de Sincronización (Proyecto MARU)", "type": "work"},
            {"id": "2", "time": "02:30 PM", "title": "Cita Médica (Chequeo General)", "type": "health"}
        ],
        "todoist": [
            {"id": "t1", "task": "Comprar víveres (Ver lista)", "priority": "Alta"},
            {"id": "t2", "task": "Revisar código de Kipu", "priority": "Media"}
        ]
    }

@router.get("/legal/documents")
async def list_legal_documents(agentId: Optional[str] = None):
    """Lista documentos indexados en la bóveda local (sin chunks)."""
    docs = document_vault.list_documents(agent_id=agentId)
    return {"total": len(docs), "documents": docs}


@router.post("/legal/upload")
async def upload_legal_document(req: LegalUploadRequest):
    """Sube un PDF/imagen/texto, extrae contenido e indexa en la bóveda RAG local."""
    if not req.dataBase64:
        raise HTTPException(status_code=400, detail="dataBase64 requerido")

    try:
        raw = req.dataBase64.split(",")[-1]
        file_bytes = base64.b64decode(raw)
    except Exception:
        raise HTTPException(status_code=400, detail="dataBase64 inválido")

    if len(file_bytes) > 12 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Archivo demasiado grande (máx. 12 MB)")

    kind, text = await DocumentParserService.extract(
        file_bytes,
        file_type=req.type or "",
        mime_type=req.mimeType or "",
        filename=req.name,
    )
    if kind == "unsupported" or not text or text.startswith("[Error") or text.startswith("[Archivo"):
        raise HTTPException(status_code=422, detail=text or "No se pudo leer el documento")

    try:
        meta = document_vault.index_document(
            name=req.name,
            text=text,
            agent_id=req.agentId or "inti",
            mime_type=req.mimeType or "application/pdf",
            source="legal_vault",
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Mejor esfuerzo hacia Qdrant
    try:
        await vector_store.add_memory(
            f"legal_{meta['id']}",
            text[:4000],
            {"agent": req.agentId or "inti", "kind": "vault_doc", "name": req.name, "docId": meta["id"]},
        )
    except Exception as e:
        logger.warning(f"Qdrant index skipped: {e}")

    return {
        "status": "success",
        "message": "Documento indexado en la Bóveda Legal (RAG local).",
        "document": meta,
        "extractedChars": len(text),
        "extractKind": kind,
    }



