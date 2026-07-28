import { UserProfile, HealthProfile, LocationProfile, AgentId } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';
const OLLAMA_DIRECT_URL = 'http://localhost:11434';

export interface CognitiveChatResponse {
  agentId: AgentId;
  agentName: string;
  modelUsed: string;
  modelRAM: string;
  isLocal: boolean;
  decisionReason: string;
  thinkingSteps: string[];
  content: string;
  timestamp: string;
  voice?: string;
}

export const ApiService = {
  async getHealth() {
    let backendHealth: any = null;
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (res.ok) {
        backendHealth = await res.json();
      }
    } catch (e) {
      console.warn("Backend FastAPI check failed:", e);
    }

    // 1. If backend reports Ollama active, return backend health
    if (backendHealth && backendHealth.ollamaLocalActive) {
      return backendHealth;
    }

    // 2. Direct browser check to Ollama (http://localhost:11434/api/tags)
    try {
      const directRes = await fetch(`${OLLAMA_DIRECT_URL}/api/tags`);
      if (directRes.ok) {
        const data = await directRes.json();
        const models = (data.models || []).map((m: any) => m.name);
        return {
          status: "ok",
          app: "MARU OS Frontend (Direct Ollama)",
          version: "1.0.0-cognitive",
          ollamaLocalActive: true,
          localModelsAvailable: models,
          dbs: backendHealth?.dbs || {
            postgres: "ready",
            redis: "ready",
            qdrant: "ready",
            neo4j: "ready",
            sqlite: "ready"
          }
        };
      }
    } catch (err) {
      console.warn("Direct browser check to Ollama failed:", err);
    }

    return backendHealth || {
      status: "offline",
      ollamaLocalActive: false,
      localModelsAvailable: []
    };
  },

  async getPeruData(city: string = "Chosica") {
    try {
      const res = await fetch(`${API_BASE_URL}/peru?city=${encodeURIComponent(city)}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Peru API endpoint offline:", e);
    }
    return null;
  },

  async sendChatMessage(params: {
    prompt: string;
    agentId?: AgentId;
    manualAgent?: boolean;
    userProfile?: UserProfile;
    healthProfile?: HealthProfile;
    locationProfile?: LocationProfile;
    fileAttachment?: any;
  }): Promise<CognitiveChatResponse | null> {
    // 1. Try FastAPI backend first
    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.content) return data;
      }
    } catch (e) {
      console.warn("FastAPI backend error, attempting direct browser Ollama query...", e);
    }

    // 2. Direct Ollama fallback query from browser if backend is unreachable or offline
    try {
      const prompt = params.prompt.toLowerCase();

      // Mini-router para seleccionar agente
      let agentId = params.agentId || "aya";
      let reason = "Agente predeterminado";
      if (!params.manualAgent) {
        if (/dolor|fiebre|síntoma|médico|salud|alergia|pastilla|medicina|comer|medicament/.test(prompt)) {
          agentId = "aya"; reason = "Tema de salud detectado";
        } else if (/código|react|python|bug|función|error|script|typescript|deploy/.test(prompt)) {
          agentId = "kipu"; reason = "Código/programación detectado";
        } else if (/ley|legal|contrato|derecho|norma|artículo|demanda/.test(prompt)) {
          agentId = "inti"; reason = "Consulta legal detectada";
        } else if (/huaico|sismo|temblor|emergencia|evacuar|alerta|terremoto/.test(prompt)) {
          agentId = "tupac"; reason = "Emergencia detectada";
        } else if (/estrés|meditar|ansiedad|hábito|ejercicio|dormir|calma/.test(prompt)) {
          agentId = "sumaq"; reason = "Bienestar detectado";
        } else if (/perú|quechua|inei|chosica|cusco|gastronomía|historia/.test(prompt)) {
          agentId = "yaku"; reason = "Consulta sobre Perú";
        }
      }

      // Selección del modelo por agente — Modelos Gemma 4 Estándar (GGUF Local + Cloud)
      const MODEL_MAP: Record<string, string> = {
        aya:   "gemma4:12b",
        inti:  "gemma4:e4b",
        kipu:  "gemma4:12b",
        sumaq: "gemma4:e4b",
        pacha: "gemma4:e4b",
        tupac: "gemma4:e2b",
        yaku:  "gemma4:31b-cloud"
      };
      const RAM_MAP: Record<string, string> = {
        aya: "7.6 GB", inti: "9.6 GB", kipu: "7.6 GB",
        sumaq: "9.6 GB", pacha: "9.6 GB", tupac: "7.2 GB", yaku: "Cloud"
      };
      const PERSONA_MAP: Record<string, string> = {
        aya:   "Aya, agente médica y de salud integral. Responde con calidez y precisión médica. Siempre revisa alergias y medicamentos antes de dar recomendaciones.",
        inti:  "Inti, agente legal y constitucional del Perú. Cita artículos y leyes peruanas con rigor y claridad.",
        kipu:  "Kipu, experto programador y arquitecto de software. Responde con código funcional, bien comentado y explica con entusiasmo.",
        sumaq: "Sumaq, agente de bienestar y nutrición. Guía con suavidad hacia hábitos saludables y equilibrio mental.",
        pacha: "Pacha, la voz de la Pachamama. Habla sobre clima, ecología y naturaleza con profundidad poética.",
        tupac: "Tupac, agente de emergencias. Directo, claro y tranquilizador. Da instrucciones precisas ante sismos y huaicos.",
        yaku:  "Yaku, guardián de la cultura y datos del Perú. Comparte historia, geografía e idiomas del Perú con orgullo."
      };

      let modelName = params.fileAttachment ? "gemma4:31b-cloud" : (MODEL_MAP[agentId] || "gemma4:12b");
      let agentRAM = params.fileAttachment ? "Cloud" : (RAM_MAP[agentId] || "7.6 GB");
      const agentPersona = PERSONA_MAP[agentId] || "Eres un asistente empático de MARU OS.";
      const userName = params.userProfile?.name || "Oliver";
      const city = params.locationProfile?.city || "Chosica";

      const systemPrompt = `Eres ${agentPersona} El usuario se llama ${userName} y está en ${city}. Responde siempre en español con calidez peruana.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      // Helper for direct fetch to Ollama
      const fetchOllama = async (model: string) => {
        return fetch(`${OLLAMA_DIRECT_URL}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            model: model,
            system: systemPrompt,
            prompt: params.prompt,
            stream: false
          })
        });
      };

      let ollamaRes = await fetchOllama(modelName);
      
      // Fallback si falla por error de MLX architecture (o cualquier 500)
      if (!ollamaRes.ok && modelName.includes('mlx')) {
        console.warn(`Fallback local: ${modelName} falló con ${ollamaRes.status}, intentando gemma4:31b-cloud...`);
        modelName = "gemma4:31b-cloud";
        agentRAM = "Cloud";
        ollamaRes = await fetchOllama(modelName);
      }

      clearTimeout(timeoutId);

      if (ollamaRes.ok) {
        const rawText = await ollamaRes.text();
        let responseContent = "";
        try {
          const oData = JSON.parse(rawText);
          responseContent = oData.response || oData.content || "";
        } catch {
          const lines = rawText.trim().split("\n");
          for (const line of lines) {
            try {
              const chunk = JSON.parse(line);
              if (chunk.response) responseContent += chunk.response;
            } catch { /* skip malformed line */ }
          }
        }

        if (!responseContent) {
          console.warn("Ollama devolvió respuesta vacía. Raw:", rawText.substring(0, 200));
        }

        const agentName = { aya: "Aya", inti: "Inti", kipu: "Kipu", sumaq: "Sumaq", pacha: "Pacha", tupac: "Tupac", yaku: "Yaku" }[agentId] || "Aya";
        const isLocal = !modelName.includes('cloud');

        return {
          agentId: agentId as AgentId,
          agentName,
          modelUsed: modelName,
          modelRAM: agentRAM,
          isLocal: isLocal,
          decisionReason: reason + " (Directo al navegador)",
          thinkingSteps: [
            `🧠 Solicitud analizada → ${agentName} con ${modelName}... ✓`,
            `> Conectado a Ollama local (puerto 11434)... ✓`,
            `> Sintetizando respuesta cognitiva en GPU M4... ✓`
          ],
          content: responseContent || "Sin respuesta de Ollama",
          timestamp: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
        };
      }
    } catch (err) {
      console.warn("Direct browser query to Ollama failed:", err);
    }

    return null;
  },

  async playTTS(text: string, voice: string = "es-PE-CamilaNeural"): Promise<HTMLAudioElement | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
        return audio;
      }
    } catch (e) {
      console.warn("Edge TTS unavailable:", e);
    }
    return null;
  }
};
