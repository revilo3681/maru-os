# 🌊 MARU OS — Sistema Operativo Cognitivo con Alma

> **M.A.R.U.** — *Memory · Agents · Reasoning · Universal*  
> El primer **Sistema Operativo Cognitivo con alma** diseñado para ejecutarse de forma local, offline-first y con soberanía absoluta sobre tu privacidad.

---

## 🌟 Características Principales

### 🧠 1. Router Cognitivo de IA Local (Ultra-Rápido por Defecto)
- **Rápido por Defecto:** Utiliza el modelo cuantizado ultrarrápido **`gemma4:e2b`** (y preferencia Q4 cuando existe) para interacciones cotidianas.
- **Escalado Automático:** Detecta consultas complejas (medicina, legal, código, emergencias) y escala a **`gemma4:12b`**, **`gemma4:e4b`** o cloud (`gemma4:cloud`).
- **Inyector IA universal:** cambios en paneles (salud, clima, traducción, notas, etc.) actualizan grafo, memoria y el próximo mensaje del chat del agente.

### 🎨 2. Portada e Interfaz
- **Landing Impacto:** sección “La IA que acompaña a las personas…” con 4 cards ilustradas (rescate, programación en la nube, Maru niños, traductor Quechua).
- **Tema Claro / Oscuro** persistente (`themeMode`) en portada y app.
- **Menú hamburguesa** en la landing + cards de los 7 agentes con iconos.
- Personalización de usuario (foto de perfil + colores de interfaz) desde Inicio.

### 🩺 3. Salud integral (Aya / Sumaq)
- Pastillero avanzado: forma, dosis (mg/ml/cucharadas), horarios, duración, cronómetro desde la última toma.
- Catálogo de ~200 medicamentos comunes con descripción y detección de interacciones.
- Condiciones crónicas personalizadas, información del paciente (edad/altura/peso), citas y tomas reales.

### 📚 4. Memoria, Grafo y Bóveda PDF
- Grafo de conocimiento + árbol “lo que MARU sabe de ti”.
- **PDFs descargables por especialidad** en Memoria / Ajustes (`/kb/pdfs/`): salud, legal, emergencia, clima, Perú, desarrollo.
- Sync remoto de KB: `POST /api/knowledge/refresh` con `MARU_KB_REMOTE_URL` (merge validado sobre el corpus offline).

### 🌿 5. Datos reales de Perú
- Clima vía Open-Meteo / SENAMHI con reporte diario por ciudad.
- Catálogo ampliado de ciudades y distritos con validación.
- Emergencias, IGP e INDECI en el corpus offline.

### 🎙️ 6. Voz e Interacción Natural (STT & TTS)
- Dictado continuo al chat y TTS por agente.
- Saludo de Inicio con cooldown (10 min) y tips amables periódicos (5 min).

### ✉️ 7. Correo, Notas y Calendario
- Borradores de correo + respuesta asistida.
- Notas con modo **hoja de cálculo**.
- Rutinas editables (diario / semanal / días custom).

### 🔒 8. Soberanía & Privacidad
- Cifrado local, frase de 12 palabras, **Modo Efímero**.
- Mínimo **1 especialista activo** (no se resetea a “todos”).

---

## 🤖 Los 7 Agentes Autónomos

| Agente | Nombre | Especialidad | Modelo Sugerido |
| :--- | :--- | :--- | :--- |
| 🩺 | **Aya** | Salud Integral, Alergias & Medicamentos | `gemma4:12b` |
| 🧘 | **Sumaq** | Bienestar, Hábitos & Meditación Guiada | `gemma4:e2b` |
| 💻 | **Kipu** | Programación, Arquitectura & Código | `gemma4:12b` |
| 🌿 | **Pacha** | Clima SENAMHI, Medio Ambiente & Aire | `gemma4:e2b` |
| 🌋 | **Tupac** | Emergencias, Sismos IGP & Huaicos | `gemma4:e4b` |
| ⚖️ | **Inti** | Asesoría Legal & Leyes de Perú | `gemma4:e4b` |
| 🇵🇪 | **Yaku** | Demografía INEI, Cultura & Lengua Quechua | `gemma4:e2b` |

---

## 🛠️ Arquitectura del Sistema

```text
Entorno del Usuario (Mac / Windows / Linux)
│
├── OLLAMA (Servidor de Modelos Locales)
│   ├── gemma4:e2b / e2b-q4
│   ├── gemma4:12b / 12b-q4
│   └── gemma4:e4b / e4b-q4 (+ cloud opcional)
│
└── CONTENEDORES DOCKER
    ├── maru_postgres  (PostgreSQL 16)
    ├── maru_redis     (Redis 7)
    ├── maru_qdrant    (Qdrant RAG)
    ├── maru_neo4j     (Neo4j grafo)
    ├── maru_backend   (FastAPI · http://localhost:8000)
    └── maru_frontend  (React + Vite · http://localhost:3000)
```

---

## 📋 Requisitos Previos

1. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**
2. **[Node.js v20+](https://nodejs.org/)** (desarrollo local)
3. **[Ollama](https://ollama.com/)**
4. **[Git](https://git-scm.com/)**

---

## 🚀 Guía de Instalación

### Paso 1: Clonar
```bash
git clone https://github.com/revilo3681/maru-os.git
cd maru-os
```

### Paso 2: Modelos Ollama
```bash
ollama pull gemma4:e2b
ollama pull gemma4:12b
ollama pull gemma4:e4b
# Opcional cuantizados
# ollama pull gemma4:e2b-q4
```

### Paso 3: Multimedia (opcional)
Coloca `musica-portada.mp3` / video en `public/` si los necesitas (no van al repo por peso).

### Paso 4: Docker Compose
```bash
docker compose up -d --build
```

Opcional — sync remoto de conocimiento (otra instancia MARU o mirror JSON):
```bash
# en docker-compose / .env del backend
MARU_KB_REMOTE_URL=http://otra-instancia:8000/api
```

### Paso 5: Abrir
👉 **`http://localhost:3000`**

### Regenerar PDFs de la bóveda
```bash
python3 scripts/generate_kb_pdfs.py
```
Quedan en `public/kb/pdfs/` (también espejo en `backend/app/data/kb/pdfs/`).

---

## 💻 Desarrollo Local (Sin Docker)

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
npm install
npm run dev
```

### Endpoints útiles de conocimiento
| Método | Ruta | Uso |
| :--- | :--- | :--- |
| GET | `/api/knowledge` | Lista / busca docs |
| GET | `/api/knowledge/export` | Export completo (sync) |
| POST | `/api/knowledge/refresh` | Merge desde `MARU_KB_REMOTE_URL` |
| GET | `/api/knowledge/pdfs` | Manifiesto de PDFs |

---

## 🧪 QA rápido sugerido

1. Portada → **Impacto** (4 ilustraciones) + Claro/Oscuro + menú hamburguesa  
2. Onboarding paso salud → alergia con Enter  
3. Aya → agregar medicamento del catálogo → ver cronómetro / Memoria  
4. Pacha → ciudad con datos Open-Meteo  
5. Ajustes → no permitir 0 agentes; descargar un PDF; “Actualizar KB”  
6. Notas → toggle hoja de cálculo  

---

## 🛠️ Mantenimiento

```bash
docker compose ps
docker compose logs -f
docker compose down
```

---

## 📄 Licencia

Desarrollado con ❤️ para empoderar la soberanía tecnológica, la privacidad y el bienestar local.
