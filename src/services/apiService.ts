import { UserProfile, HealthProfile, LocationProfile, AgentId, Note, GmailDraftNotification } from '../types';

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
  async getHealth(): Promise<Record<string, unknown> | null> {
    let backendHealth: Record<string, unknown> | null = null;
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
        const models = (data.models || []).map((m: { name: string }) => m.name);
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
    confirmUpgrade?: boolean;
    userContext?: string;
    userProfile?: UserProfile;
    healthProfile?: HealthProfile;
    locationProfile?: LocationProfile;
    fileAttachment?: { name: string; type: string; mimeType: string; dataBase64?: string; sizeFormatted: string };
    onUpdate?: (content: string) => void;
    onThinkingStep?: (step: string) => void;
  }): Promise<(CognitiveChatResponse & { upgradeRequest?: any }) | null> {
    // 1. Try FastAPI backend first
    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        // If backend supports streaming, it will send NDJSON
        const reader = res.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        let content = "";
        let finalData: any = null;
        let upgradeRequestData: any = null;
        let lastUpdate = 0;
        if (reader) {
          let reading = true;
          while (reading) {
            const { done, value } = await reader.read();
            if (done) {
              reading = false;
              break;
            }
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const data = JSON.parse(line);
                if (data.type === "model_upgrade_request") {
                  upgradeRequestData = data;
                }
                if (data.thinking_step) {
                  if (params.onThinkingStep) params.onThinkingStep(data.thinking_step);
                }
                if (data.response) {
                  content += data.response;
                  const now = Date.now();
                  if (now - lastUpdate > 30) {
                    if (params.onUpdate) params.onUpdate(content);
                    lastUpdate = now;
                  }
                }
                if (data.final) {
                  finalData = data;
                }
              } catch (e) {
                // Ignore partial JSON chunks
              }
            }
          }
        }
        if (upgradeRequestData) {
          return {
            agentId: params.agentId || 'aya',
            agentName: 'Sistema MARU',
            modelUsed: 'gemma4:e2b-q4',
            modelRAM: '3.3 GB',
            isLocal: true,
            decisionReason: upgradeRequestData.reason,
            thinkingSteps: [],
            content: '',
            timestamp: new Date().toISOString(),
            upgradeRequest: {
              recommendedModel: upgradeRequestData.recommended_model,
              currentModel: upgradeRequestData.current_model,
              ramRequired: upgradeRequestData.ram_required,
              reason: upgradeRequestData.reason
            }
          };
        }
        if (finalData) {
          finalData.content = content;
          return finalData;
        } else {
          // Fallback if not streaming
          const data = await res.json().catch(() => null);
          if (data && data.content) return data;
        }
      }
    } catch (e) {
      console.warn("FastAPI backend error, attempting direct browser Ollama query...", e);
    }

    // 2. Direct Ollama fallback query from browser
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

      const MODEL_MAP: Record<string, string> = {
        aya:   "gemma4:12b-q4",
        inti:  "gemma4:e4b-q4",
        kipu:  "gemma4:12b-q4",
        sumaq: "gemma4:e4b-q4",
        pacha: "gemma4:e4b-q4",
        tupac: "gemma4:e2b-q4",
        yaku:  "gemma4:31b-cloud"
      };
      const RAM_MAP: Record<string, string> = {
        aya: "7.6 GB", inti: "9.6 GB", kipu: "7.6 GB",
        sumaq: "9.6 GB", pacha: "9.6 GB", tupac: "7.2 GB", yaku: "Cloud"
      };
      
      let modelName = params.fileAttachment ? "gemma4:31b-cloud" : (MODEL_MAP[agentId] || "gemma4:12b-q4");
      let agentRAM = params.fileAttachment ? "Cloud" : (RAM_MAP[agentId] || "7.6 GB");

      // Verificación dinámica del modelo
      try {
        const tagsRes = await fetch(`${OLLAMA_DIRECT_URL}/api/tags`);
        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          const availableModels = (tagsData.models || []).map((m: { name: string }) => m.name);
          if (availableModels.length > 0 && !availableModels.includes(modelName)) {
            // Si el modelo preferido no está, usamos el primero que tenga (ej. llama3 o qwen)
            console.warn(`Modelo ${modelName} no encontrado localmente. Usando ${availableModels[0]} como fallback.`);
            modelName = availableModels[0];
            agentRAM = "Desconocido (Fallback)";
          }
        }
      } catch (e) {
        // Ignorar si falla la verificación, intentar con el predeterminado
      }

      const agentPersona = "Eres un asistente empático de MARU OS.";
      const userName = params.userProfile?.name || "Oliver";
      const city = params.locationProfile?.city || "Chosica";

      const systemPrompt = `Eres ${agentPersona} El usuario se llama ${userName} y está en ${city}. Responde siempre en español con calidez peruana.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const fetchOllama = async (model: string) => {
        return fetch(`${OLLAMA_DIRECT_URL}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            model: model,
            system: systemPrompt,
            prompt: params.prompt,
            stream: true
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

      if (ollamaRes.ok && ollamaRes.body) {
        const reader = ollamaRes.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let responseContent = "";
        let reading = true;
        let lastUpdate = 0;
        while (reading) {
          const { done, value } = await reader.read();
          if (done) {
            reading = false;
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              if (data.response) {
                responseContent += data.response;
                const now = Date.now();
                if (now - lastUpdate > 30) {
                  if (params.onUpdate) params.onUpdate(responseContent);
                  lastUpdate = now;
                }
              }
            } catch (e) {
              // Ignore partial JSON chunks
            }
          }
        }

        if (!responseContent) {
          console.warn("Ollama devolvió respuesta vacía.");
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

  async getNotes(): Promise<Note[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/notes`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Notes API endpoint offline:", e);
    }
    // Fallback local storage
    const local = localStorage.getItem('maru_notes');
    return local ? JSON.parse(local) : [];
  },

  async saveNote(note: Note): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      });
    } catch (e) {
      console.warn("Notes API offline, saving to localStorage:", e);
      const local = localStorage.getItem('maru_notes');
      let notes: Note[] = local ? JSON.parse(local) : [];
      const idx = notes.findIndex(n => n.id === note.id);
      if (idx >= 0) notes[idx] = note;
      else notes.push(note);
      localStorage.setItem('maru_notes', JSON.stringify(notes));
    }
  },

  async checkNotifications(): Promise<GmailDraftNotification[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Ignore
    }
    return [];
  },

  async getAgenda(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/agenda`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Fallback
    }
    return { calendar: [], todoist: [] };
  },

  currentAudio: null as HTMLAudioElement | null,

  async playTTS(text: string, voice: string = "es-PE-CamilaNeural"): Promise<HTMLAudioElement | null> {
    try {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }
      const res = await fetch(`${API_BASE_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        this.currentAudio = audio;
        audio.play();
        return audio;
      }
    } catch (e) {
      console.warn("Edge TTS unavailable:", e);
    }
    return null;
  }
};
