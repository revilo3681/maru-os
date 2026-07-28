# 🌊🎬 MARU OS — Sistema Operativo Cognitivo con Alma

MARU OS es el primer **Sistema Operativo Cognitivo con alma** diseñado para ejecutarse localmente con privacidad radical y fallback a nubes cuando sea necesario.

---

## 🛠️ Arquitectura Completa

```text
MacBook M4 Pro / Mac / Linux
│
├── OLLAMA (Local Model Server)
│   ├── gemma4:e4b-mlx (~6GB RAM)
│   ├── gemma4:12b-mlx (~9GB RAM)
│   └── gemma4:e2b-mlx (~4GB RAM)
│
└── DOCKER CONTAINERS
    ├── postgres:16-alpine (Datos estructurados, usuarios, calendario)
    ├── redis:7-alpine (Caché rápida de respuestas)
    ├── qdrant (Vector DB para memoria semántica RAG)
    ├── neo4j:5-community (Grafo de relaciones alergias/medicamentos)
    ├── backend (FastAPI + Python 3.12 en http://localhost:8000)
    └── frontend (React 19 + Vite + Three.js en http://localhost:3000)
```

---

## 🚀 Cómo Ejecutar

### 1. Iniciar la Infraestructura con Docker
```bash
docker compose up -d
```

### 2. (Opcional) Ejecutar el Backend en Python directamente
Si prefieres correr el backend fuera de Docker:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Ejecutar el Frontend
```bash
npm install
npm run dev
```
Abre en tu navegador `http://localhost:3000`.

---

## 🤖 Los 7 Agentes Autonómos

1. 🩺 **Aya (Médico):** Evaluación de salud, alergias en Neo4j y guías MINSA.
2. ⚖️ **Inti (Legal):** Asesoría en derecho y legislación peruana.
3. 💻 **Kipu (Programador):** Desarrollo de software y quipus de código.
4. 🧘 **Sumaq (Bienestar):** Hábitos, meditación y estilo de vida.
5. 🌿 **Pacha (Pachamama):** Medio ambiente, clima y calidad del aire SENAMHI.
6. 🌋 **Tupac (Emergencias):** Alertas de sismos IGP y evacuación con modelo E2B.
7. 🇵🇪 **Yaku (Perú):** Demografía INEI, historia, cultura y quechua.
