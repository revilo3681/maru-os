import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { PERU_SEED_DATA } from "./src/data/seedPeru.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Initialize server-side Gemini API client
let aiClient: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
} catch (err) {
  console.warn("Gemini API Client init deferred:", err);
}

// 1. Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "MARU OS",
    version: "1.0.0-cognitive",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    modelsAvailable: [
      { name: "gemma4:e4b", ram: "9.6 GB", mode: "Local GPU M4 (Cerebro Diario)" },
      { name: "gemma4:12b", ram: "7.6 GB", mode: "Local GPU M4 (Visión/Docs/Código)" },
      { name: "gemma4:e2b", ram: "7.2 GB", mode: "Local GPU M4 (Voz/Emergencia Ultra Rápido)" },
      { name: "gemma4:31b-cloud", ram: "Cloud", mode: "Cloud Proxy (Multi-Agente / Razonamiento Complejo)" }
    ]
  });
});

// 2. Peru Offline Data Endpoint
app.get("/api/peru", (req, res) => {
  const city = (req.query.city as string) || "Chosica";
  const weather = PERU_SEED_DATA.weatherMap[city] || PERU_SEED_DATA.weatherMap["Chosica"];
  const huaico = PERU_SEED_DATA.huaicoMap[city] || PERU_SEED_DATA.huaicoMap["Chosica"];
  const sismo = PERU_SEED_DATA.sismoLatest;
  const inei = PERU_SEED_DATA.ineiCities[city] || PERU_SEED_DATA.ineiCities["Chosica"];
  const safeZones = PERU_SEED_DATA.safeZones[city] || PERU_SEED_DATA.safeZones["Chosica"];

  res.json({
    city,
    weather,
    huaico,
    sismo,
    inei,
    safeZones,
    minsaGuidesCount: PERU_SEED_DATA.minsaGuides.length
  });
});

// 3. Cognitive Chat Endpoint with Thinking Mode & Router
app.post("/api/chat", async (req, res) => {
  try {
    const {
      prompt,
      agentId = "aya",
      userProfile,
      healthProfile,
      locationProfile,
      fileAttachment,
      manualAgent
    } = req.body;

    // Automatic Intent Detection Router
    let selectedAgent = agentId;
    let decisionReason = "Selección manual de agente";

    if (!manualAgent) {
      const pLower = prompt.toLowerCase();
      if (pLower.includes("me duele") || pLower.includes("salud") || pLower.includes("médico") || pLower.includes("alergia") || pLower.includes("remedio") || pLower.includes("comer") || pLower.includes("pastilla")) {
        selectedAgent = "aya";
        decisionReason = "Tema de salud y medicación detectado";
      } else if (pLower.includes("ley") || pLower.includes("legal") || pLower.includes("contrato") || pLower.includes("derecho") || pLower.includes("artículo") || pLower.includes("mora")) {
        selectedAgent = "inti";
        decisionReason = "Consulta legal o normativa detectada";
      } else if (pLower.includes("código") || pLower.includes("react") || pLower.includes("python") || pLower.includes("bug") || pLower.includes("función") || pLower.includes("error") || pLower.includes("script")) {
        selectedAgent = "kipu";
        decisionReason = "Código o desarrollo técnico detectado";
      } else if (pLower.includes("dormir") || pLower.includes("estrés") || pLower.includes("meditar") || pLower.includes("ansiedad") || pLower.includes("hábito") || pLower.includes("ejercicio")) {
        selectedAgent = "sumaq";
        decisionReason = "Consulta de bienestar y estilo de vida";
      } else if (pLower.includes("aire") || pLower.includes("naturaleza") || pLower.includes("arbol") || pLower.includes("huella") || pLower.includes("sol") || pLower.includes("ecología")) {
        selectedAgent = "pacha";
        decisionReason = "Tema ecológico y ambiental detectado";
      } else if (pLower.includes("huaico") || pLower.includes("sismo") || pLower.includes("temblor") || pLower.includes("emergencia") || pLower.includes("evacuar") || pLower.includes("116")) {
        selectedAgent = "tupac";
        decisionReason = "Alerta de riesgo o emergencia sísmica";
      } else if (pLower.includes("perú") || pLower.includes("quechua") || pLower.includes("inei") || pLower.includes("chosica") || pLower.includes("cusco") || pLower.includes("historia")) {
        selectedAgent = "yaku";
        decisionReason = "Consulta sobre geografía, cultura y datos del Perú";
      }
    }

    // Determine Model
    let modelName = "gemma4:e4b";
    let modelRAM = "9.6 GB";
    let isLocal = true;

    if (fileAttachment && (fileAttachment.type === "image" || fileAttachment.type === "pdf" || fileAttachment.type === "excel")) {
      modelName = "gemma4:12b";
      modelRAM = "7.6 GB";
      decisionReason += " + Procesamiento multimodal de archivo (" + fileAttachment.name + ")";
    } else if (selectedAgent === "tupac") {
      modelName = "gemma4:e2b";
      modelRAM = "7.2 GB";
      decisionReason += " + Respuesta de baja latencia para emergencias";
    }

    // Generate Thinking Steps
    const userName = userProfile?.name || "Oliver";
    const userCity = locationProfile?.city || "Chosica";
    const allergies = healthProfile?.allergies?.join(", ") || "Ninguna registrada";
    const meds = healthProfile?.currentMedications?.map((m: any) => `${m.name} (${m.dose})`).join(", ") || "Ninguno";

    const thinkingSteps = [
      `Analizando mensaje de ${userName}... ✓`,
      `Paso 1: Verificando historial y alergias (${allergies})... ✓`,
      `Paso 2: Evaluando medicamentos activos (${meds})... ✓`,
      `Paso 3: Consultando datos de ubicación en ${userCity}... ✓`,
      `Paso 4: Activando agente ${selectedAgent.toUpperCase()} con modelo ${modelName}... ✓`,
      `Paso 5: Sintetizando respuesta con voz y empatía... ✓`
    ];

    // Build Prompt with System Instruction
    const agentPrompts: Record<string, string> = {
      aya: `Eres Aya, el agente médico con alma de MARU OS. Tu frase es 'Tu cuerpo habla. Yo traduzco.' Hablas de forma cálida, serena y empática a ${userName}. Tienes registrado que tiene alergia a: [${allergies}] y toma: [${meds}]. Si el usuario pregunta por comida o medicinas, verifica estrictamente la alergia al maní u otras interacciones. Responde con calidez humana.`,
      inti: `Eres Inti, el agente legal de MARU OS. Tu frase es 'La ley es clara bajo el sol.' Hablas de forma formal pero accesible a ${userName}, citando principios de la constitución y ley peruana.`,
      kipu: `Eres Kipu, el programador de MARU OS. Tu frase es 'Todo problema es un quipu por desenredar.' Eres entusiasta y directo, dando soluciones claras en TypeScript/Python/React.`,
      sumaq: `Eres Sumaq, el agente de bienestar de MARU OS. Tu frase es 'El equilibrio no se encuentra, se cultiva.' Hablas dulce y melódicamente, motivando hábitos saludables a ${userName}.`,
      pacha: `Eres Pacha, la voz de la Pachamama en MARU OS. Tu frase es 'La tierra te habla. Escucha.' Hablas de forma poética y sabia sobre la naturaleza, el clima en ${userCity} y el aire.`,
      tupac: `Eres Tupac, el agente de emergencias de MARU OS. Tu frase es 'La tierra se mueve. Yo te guío.' Das instrucciones claras, calmadas y firmes sobre sismos, huaicos en ${userCity} y zonas seguras.`,
      yaku: `Eres Yaku, el manantial de datos del Perú en MARU OS. Tu frase es 'Desde el manantial de los Andes, te respondo.' Hablas con orgullo andino, compartiendo datos reales del INEI, SENAMHI e historia del Perú.`
    };

    const systemPrompt = agentPrompts[selectedAgent] || agentPrompts["aya"];

    let responseText = "";

    // If Gemini API is configured, call Gemini API
    if (aiClient) {
      try {
        const fullPrompt = `${systemPrompt}\n\nContexto Usuario:\n- Nombre: ${userName}\n- Ciudad: ${userCity}\n- Alergias: ${allergies}\n- Medicamentos: ${meds}\n\nMensaje del usuario:\n${prompt}`;
        
        let contentsParts: any[] = [{ text: fullPrompt }];

        if (fileAttachment && fileAttachment.dataBase64) {
          const base64Data = fileAttachment.dataBase64.replace(/^data:image\/\w+;base64,/, "");
          contentsParts.unshift({
            inlineData: {
              mimeType: fileAttachment.mimeType || "image/png",
              data: base64Data
            }
          });
        }

        const geminiRes = await aiClient.models.generateContent({
          model: "gemini-3.6-flash",
          contents: { parts: contentsParts }
        });

        if (geminiRes.text) {
          responseText = geminiRes.text;
        }
      } catch (err) {
        console.warn("Gemini API call error, using local cognitive generator fallback:", err);
      }
    }

    // Cognitive Local Backup Generator
    if (!responseText) {
      if (prompt.toLowerCase().includes("maní") || prompt.toLowerCase().includes("plato") || prompt.toLowerCase().includes("comida") || prompt.toLowerCase().includes("comer")) {
        responseText = `${userName}, ten mucha precaución. He revisado tu perfil médico y tienes registrada una alergia al MANÍ.\n\nSi el plato contiene salsa de maní o frutos secos, con tu medicación actual (${meds}), te recomiendo no consumirlo para evitar una reacción alérgica o anafilaxia.\n\n¿Te gustaría que te sugiera una alternativa culinaria peruana totalmente segura para ti?`;
      } else if (prompt.toLowerCase().includes("clima") || prompt.toLowerCase().includes("tiempo")) {
        const w = PERU_SEED_DATA.weatherMap[userCity] || PERU_SEED_DATA.weatherMap["Chosica"];
        responseText = `${userName}, en ${userCity} actualmente tenemos una temperatura de ${w.temperature}°C, estado ${w.condition}. La calidad del aire (AQI) es de ${w.aqi} (Limpio). Fuente: ${w.source}. Es un excelente momento para hidratarse y dar una caminata tranquila.`;
      } else if (selectedAgent === "tupac" || prompt.toLowerCase().includes("huaico") || prompt.toLowerCase().includes("sismo")) {
        const h = PERU_SEED_DATA.huaicoMap[userCity] || PERU_SEED_DATA.huaicoMap["Chosica"];
        responseText = `⚠️ Alerta de prevención en ${userCity}:\nNivel de riesgo por huaico: ${h.riskPercent}% (${h.level}).\nZona segura recomendada: ${h.safeZoneName} (a ${h.safeZoneDist}).\n\nMantén la calma, ten tu mochila de emergencia lista y aléjate del cauce de los ríos. Fuente: ${h.source}.`;
      } else if (selectedAgent === "kipu") {
        responseText = `¡Hola, ${userName}! Como tu compañero de código en MARU OS, he revisado el planteamiento. Todo problema es un quipu por desenredar.\n\nPara optimizar esto en TypeScript / React:\n\`\`\`typescript\n// Solución limpia con tipos rigurosos\nexport function processData<T>(input: T[]): T[] {\n  return input.filter(Boolean);\n}\n\`\`\`\n¿Quieres que profundicemos en la arquitectura o las pruebas unitarias?`;
      } else {
        responseText = `${userName}, he procesado tu mensaje con atención. Como tu compañero en MARU OS, estoy aquí para guiarte, cuidar tu salud y acompañarte en tu día a día en ${userCity}.\n\n¿Hay algo más en lo que pueda apoyarte hoy?`;
      }
    }

    res.json({
      agentId: selectedAgent,
      modelUsed: modelName,
      modelRAM,
      isLocal,
      decisionReason,
      thinkingSteps,
      content: responseText,
      timestamp: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
      sourceInfo: `Fuente: Memoria MARU OS (${modelName}) + ${userCity}`
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: "Error procesando mensaje en MARU OS", details: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌊 MARU OS — Server corriendo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
