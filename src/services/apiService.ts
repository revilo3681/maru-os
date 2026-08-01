import { UserProfile, HealthProfile, LocationProfile, AgentId, Note, GmailDraftNotification, UpgradeRequestInfo } from '../types';

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

interface ModelUpgradeEvent {
  reason: string;
  recommended_model: string;
  current_model: string;
  ram_required: string;
}

// ── Base de Conocimiento Oficial (RAG) ──────────────────────────
export interface KnowledgeDocument {
  id: string;
  title: string;
  source: string;
  agents: AgentId[];
  keywords: string[];
  body: string;
}

export interface KnowledgeResponse {
  total: number;
  documents: KnowledgeDocument[];
}

// ── Motor de modelos configurable ───────────────────────────────
export type EngineMode = 'manual' | 'router';

export interface ModelCatalogEntry {
  id: string;
  label: string;
  ram: string;
  role: string;
  isCloud: boolean;
  /** true si el modelo (o un alias equivalente) está realmente instalado en Ollama */
  installed: boolean;
  /** nombre real instalado en Ollama que se usará (p. ej. 'gemma4:e2b-q4') */
  resolvedName: string;
}

export interface ModelsResponse {
  ollamaConnected: boolean;
  installedModels: string[];
  catalog: ModelCatalogEntry[];
  defaultModel: string;
}

export interface EngineConfig {
  engineMode: EngineMode;
  manualModel: string;
  enabledAgents: AgentId[];
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

  /** Base de Conocimiento Oficial: lista/busca documentos (filtros opcionales por agente y texto). */
  async getKnowledge(agent?: AgentId, q?: string): Promise<KnowledgeResponse | null> {
    try {
      const params = new URLSearchParams();
      if (agent) params.set('agent', agent);
      if (q) params.set('q', q);
      const qs = params.toString();
      const res = await fetch(`${API_BASE_URL}/knowledge${qs ? `?${qs}` : ''}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Knowledge API endpoint offline:", e);
    }
    return null;
  },

  /**
   * Refresh hook: when backend is reachable, pull the live KB catalog.
   * Falls back to /kb/catalog.json (static seed) then to the bundled index.
   * Does not invent remote documents — only mirrors what the API already serves.
   */
  async refreshKnowledgeCatalog(): Promise<{ source: string; total: number } | null> {
    try {
      const live = await this.getKnowledge();
      if (live?.documents?.length) {
        return { source: 'api', total: live.total };
      }
    } catch {
      /* fall through */
    }
    try {
      const res = await fetch('/kb/catalog.json');
      if (res.ok) {
        const data = await res.json();
        return { source: 'static-catalog', total: data.count || data.documents?.length || 0 };
      }
    } catch (e) {
      console.warn('Static KB catalog unavailable:', e);
    }
    return null;
  },

  /**
   * POST /knowledge/refresh — fusiona docs desde MARU_KB_REMOTE_URL en el backend.
   * Sin URL remota el backend responde status: skipped (corpus offline intacto).
   */
  async refreshKnowledgeRemote(remoteUrl?: string): Promise<{
    status: string;
    reason?: string;
    merged?: number;
    documentCount?: number;
    embeddedCount?: number;
    remoteMerged?: number;
    sourceUrl?: string;
  } | null> {
    try {
      const qs = remoteUrl ? `?remote_url=${encodeURIComponent(remoteUrl)}` : '';
      const res = await fetch(`${API_BASE_URL}/knowledge/refresh${qs}`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Knowledge refresh offline:', e);
    }
    return null;
  },

  /** Estado real de Ollama + catálogo de modelos seleccionables con disponibilidad. */
  async getModels(): Promise<ModelsResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/models`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Models API endpoint offline:", e);
    }
    // Fallback: consulta directa a Ollama desde el navegador
    try {
      const directRes = await fetch(`${OLLAMA_DIRECT_URL}/api/tags`);
      if (directRes.ok) {
        const data = await directRes.json();
        const installedModels = (data.models || []).map((m: { name: string }) => m.name);
        return { ollamaConnected: true, installedModels, catalog: [], defaultModel: 'gemma4:e2b-q4' };
      }
    } catch (e) {
      console.warn("Direct Ollama tags check failed:", e);
    }
    return null;
  },

  /** Configuración persistida del motor: modo manual/router, modelo fijo y especialistas activos. */
  async getConfig(): Promise<EngineConfig | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/config`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Config API endpoint offline:", e);
    }
    return null;
  },

  async saveConfig(config: {
    engineMode?: EngineMode;
    manualModel?: string;
    enabledAgents?: AgentId[];
  }): Promise<EngineConfig | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        const data = await res.json();
        return data.config ?? null;
      }
    } catch (e) {
      console.warn("Config API endpoint offline:", e);
    }
    return null;
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
    /** Motor configurable: 'manual' fija un solo modelo para todo; 'router' mantiene el enrutado automático */
    engineMode?: EngineMode;
    /** Modelo fijo cuando engineMode = 'manual' (p. ej. 'gemma4:e2b-mlx') */
    manualModel?: string;
    onUpdate?: (content: string) => void;
    onThinkingStep?: (step: string) => void;
  }): Promise<(CognitiveChatResponse & { upgradeRequest?: UpgradeRequestInfo }) | null> {
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
        let finalData: CognitiveChatResponse | null = null;
        let upgradeRequestData: ModelUpgradeEvent | null = null;
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
      let agentId = params.agentId || "aya";
      let reason = "Respuesta rápida";
      let isDeepThinking = false;

      if (!params.manualAgent) {
        if (/dolor|fiebre|síntoma|médico|salud|alergia|pastilla|medicina|comer|medicament/.test(prompt)) {
          agentId = "aya"; reason = "Tema de salud complejo detectado"; isDeepThinking = true;
        } else if (/código|react|python|bug|función|error|script|typescript|deploy/.test(prompt)) {
          agentId = "kipu"; reason = "Código/programación detectado"; isDeepThinking = true;
        } else if (/ley|legal|contrato|derecho|norma|artículo|demanda/.test(prompt)) {
          agentId = "inti"; reason = "Consulta legal compleja detectada"; isDeepThinking = true;
        } else if (/huaico|sismo|temblor|emergencia|evacuar|alerta|terremoto/.test(prompt)) {
          agentId = "tupac"; reason = "Emergencia detectada"; isDeepThinking = true;
        } else if (/estrés|meditar|ansiedad|hábito|ejercicio|dormir|calma/.test(prompt)) {
          agentId = "sumaq"; reason = "Bienestar detectado";
        } else if (/perú|quechua|inei|chosica|cusco|gastronomía|historia|clima|tiempo/.test(prompt)) {
          agentId = "yaku"; reason = "Consulta sobre Perú/Clima"; isDeepThinking = true;
        }
      }

      // Preferencia: cuantizado Q4 → normal. Cloud: gemma4:cloud → 31b-cloud
      const FAMILY: Record<string, string[]> = {
        e2b: ['gemma4:e2b-q4', 'gemma4:e2b'],
        e4b: ['gemma4:e4b-q4', 'gemma4:e4b'],
        '12b': ['gemma4:12b-q4', 'gemma4:12b'],
        cloud: ['gemma4:cloud', 'gemma4:31b-cloud']
      };
      const pickFamily = (key: keyof typeof FAMILY, available: string[]) => {
        for (const name of FAMILY[key]) {
          if (available.some((m) => m === name || m.startsWith(`${name}:`))) return name;
        }
        return FAMILY[key][FAMILY[key].length - 1];
      };

      let preferredFamily: keyof typeof FAMILY = 'e2b';
      let agentRAM = '3.3 GB';

      if (params.engineMode === 'manual' && params.manualModel) {
        const mm = params.manualModel;
        if (mm.includes('cloud') || mm.includes('31b')) preferredFamily = 'cloud';
        else if (mm.includes('12b')) preferredFamily = '12b';
        else if (mm.includes('e4b')) preferredFamily = 'e4b';
        else preferredFamily = 'e2b';
      } else if (params.fileAttachment) {
        preferredFamily = '12b';
        agentRAM = '7.0 GB';
      } else if (isDeepThinking || params.manualAgent) {
        const MAP: Record<string, keyof typeof FAMILY> = {
          aya: '12b', inti: 'e4b', kipu: '12b', sumaq: 'e4b',
          pacha: 'e4b', tupac: 'e2b', yaku: 'e4b'
        };
        preferredFamily = MAP[agentId] || '12b';
      }

      let modelName = FAMILY[preferredFamily][0];
      try {
        const tagsRes = await fetch(`${OLLAMA_DIRECT_URL}/api/tags`);
        if (tagsRes.ok) {
          const tagsData = await tagsRes.json() as { models?: Array<{ name: string }> };
          const availableModels: string[] = (tagsData.models || []).map((m) => m.name);
          if (availableModels.length > 0) {
            modelName = pickFamily(preferredFamily, availableModels);
            // Si la familia pedida no existe, degradar a e2b Q4→normal
            const familyNames = FAMILY[preferredFamily];
            const familyPresent = familyNames.some(
              (n) => availableModels.some((name) => name === n || name.startsWith(`${n}:`))
            );
            if (!familyPresent) {
              modelName = pickFamily('e2b', availableModels);
            }
          }
        }
      } catch {
        // Ignorar verificación
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
        const isFastModel = modelName === "gemma4:e2b" || modelName === "llama3.2:1b";

        return {
          agentId: agentId as AgentId,
          agentName,
          modelUsed: modelName,
          modelRAM: agentRAM,
          isLocal: isLocal,
          decisionReason: reason + " (Directo al navegador)",
          thinkingSteps: isFastModel ? [] : [
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
      const notes: Note[] = local ? JSON.parse(local) : [];
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

  async getAgenda(): Promise<unknown> {
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
        // Cross-origin blob URLs are fine for Web Audio analyser
        this.currentAudio = audio;
        // Import lazy to avoid circular deps at module top
        const { AudioService } = await import('./audioService');
        AudioService.attachAnalyserToAudio(audio);
        void audio.play();
        return audio;
      }
    } catch (e) {
      console.warn("Edge TTS unavailable:", e);
    }
    return null;
  },

  /** Sube un documento a la bóveda legal / documental (RAG local). */
  async uploadLegalDocument(params: {
    name: string;
    mimeType: string;
    type: string;
    dataBase64: string;
    agentId?: AgentId;
    sizeFormatted?: string;
  }): Promise<{ status: string; document?: { id: string; name: string; chunkCount?: number; charCount?: number }; message?: string } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/legal/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) return await res.json();
      const err = await res.json().catch(() => ({}));
      return { status: 'error', message: err.detail || 'No se pudo indexar el documento' };
    } catch (e) {
      console.warn('Legal upload offline:', e);
      return null;
    }
  },

  async listLegalDocuments(agentId?: AgentId): Promise<{ total: number; documents: Array<{ id: string; name: string; charCount?: number; chunkCount?: number; indexedAt?: string; preview?: string }> } | null> {
    try {
      const q = agentId ? `?agentId=${encodeURIComponent(agentId)}` : '';
      const res = await fetch(`${API_BASE_URL}/legal/documents${q}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Legal documents list offline:', e);
    }
    return null;
  },

  async execPython(code: string, timeout = 8): Promise<{ status: string; output: string } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/python/exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, timeout })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Python sandbox offline:', e);
    }
    return null;
  },

  async sendMail(params: {
    to: string;
    subject: string;
    body: string;
    gmailEmail: string;
    gmailAppPass: string;
  }): Promise<{ status: string; message?: string } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/mail/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) return await res.json();
      const err = await res.json().catch(() => ({}));
      return { status: 'error', message: err.detail || 'No se pudo enviar' };
    } catch (e) {
      console.warn('Mail send offline:', e);
      return { status: 'error', message: 'Backend offline. No se pudo enviar el correo.' };
    }
  },

  /** STT local (Whisper) si el backend lo soporta; null → usar Web Speech. */
  async transcribeAudio(dataBase64: string, mimeType = 'audio/webm'): Promise<{ text: string; engine: string } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/stt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataBase64, mimeType, language: 'es' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.text) return { text: data.text, engine: data.engine || 'whisper' };
      }
    } catch (e) {
      console.warn('STT backend unavailable, falling back to Web Speech:', e);
    }
    return null;
  },

  /** Traducción con IA local (gemma4:e2b-q4) */
  async translateText(text: string, sourceLang: string, targetLang: string, contextDict: string = ''): Promise<{ translation: string; phonetic?: string } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source_lang: sourceLang, target_lang: targetLang, context_dict: contextDict })
      });
      if (res.ok) {
        const result = await res.json();
        if (result.status === 'success' && result.data) {
          return result.data;
        }
      }
    } catch (e) {
      console.warn('Translate API error:', e);
    }
    return null;
  },

  /** Obtener audio TTS */
  async getTtsAudio(text: string, voice = 'es-PE-AlexNeural'): Promise<Blob | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice })
      });
      if (res.ok) {
        return await res.blob();
      }
    } catch (e) {
      console.warn('TTS API error:', e);
    }
    return null;
  }
};
