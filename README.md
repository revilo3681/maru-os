# 🌊 MARU OS — Sistema Operativo Cognitivo con Alma

> **M.A.R.U.** — *Memory · Agents · Reasoning · Universal*  
> El primer **Sistema Operativo Cognitivo con alma** diseñado para ejecutarse de forma local, offline-first y con soberanía absoluta sobre tu privacidad.

---

## 🌟 Características Principales

### 🧠 1. Router Cognitivo de IA Local (Ultra-Rápido por Defecto)
- **Rápido por Defecto:** Utiliza el modelo cuantizado ultrarrápido **`gemma4:e2b`** (3.2 GB RAM) para interacciones cotidianas y conversacionales de respuesta visualmente instantánea.
- **Escalado Automático:** Detecta cuando la consulta requiere razonamiento profundo (medicina, legal, análisis de código o emergencias) y escala automáticamente a **`gemma4:12b`** o **`gemma4:e4b`**.
- **Ocultamiento de Proceso Cognitivo:** El cuadro de "Pensando..." solo se despliega en consultas complejas, manteniendo las conversaciones simples limpias y veloces.

### 🎨 2. Diseño Moderno Claro (Estilo Apple / Google iOS)
- **Aesthetica Premium:** Tarjetas blancas `shadow-sm`, bordes redondeados `rounded-2xl` y tipografía optimizada.
- **Chat Estilo iOS:** Mensajes del usuario en burbuja azul `#007AFF` e integración de tarjetas claras `#F2F2F7` para las respuestas de los agentes.
- **Portada Multimedia:** Fondo en video promocional (`fondo-video.mp4`) y reproductor de música de fondo (`musica-portada.mp3`) con menú desplegable para control de volumen de 0% a 100%, silenciador y play/pausa.

### 🎙️ 3. Voz e Interacción Natural (STT & TTS)
- **Banner Evidente de Voz (STT):** Banner pulsante en vivo que notifica cuando el micrófono está grabando mediante procesamiento rápido con Whisper.
- **Lectura por Voz (TTS):** Cada agente cuenta con una síntesis de voz personalizada según su rol.

### 🚨 4. Módulo de Emergencias Perú (Huaicos & Sismos)
- Integración de reportes sísmicos del **IGP** y alertas de precipitaciones/huaicos en **Chosica y Lima Metropolitana**.
- Generación instantánea de **Mapa de Evacuación** a zonas seguras y protocolo de emergencia con el agente **Tupac**.

### ✉️ 5. Integración Real con Gmail
- Lectura en segundo plano de correos de alta prioridad.
- Notificación automática y generación de **Borradores Inteligentes** editables o enviables con 1-click.

### 🗓️ 6. Calendario & Gestor de Tareas Nativo
- Sincronización de eventos, rutinas de bienestar y tomas de medicamentos reflejados directamente en el Dashboard principal.

### 🔒 7. Soberanía & Privacidad Radical
- Cifrado local en dispositivo, frases de recuperación de 12 palabras y **Modo Efímero** para evitar el guardado de historial en PostgreSQL o en la base vectorial RAG.

---

## 🤖 Los 7 Agentes Autónomos

| Agente | Nombre | Especialidad | Modelo Sugerido |
| :--- | :--- | :--- | :--- |
| 🩺 | **Aya** | Salud Integral, Alergias & Medicamentos | `gemma4:12b` (7.6GB) |
| 🧘 | **Sumaq** | Bienestar, Hábitos & Meditación Guiada | `gemma4:e2b` (3.2GB) |
| 💻 | **Kipu** | Programación, Arquitectura & Código | `gemma4:12b` (7.6GB) |
| 🌿 | **Pacha** | Clima SENAMHI, Medio Ambiente & Aire | `gemma4:e2b` (3.2GB) |
| 🌋 | **Tupac** | Emergencias, Sismos IGP & Huaicos | `gemma4:e4b` (9.6GB) |
| ⚖️ | **Inti** | Asesoría Legal & Leyes de Perú | `gemma4:e4b` (9.6GB) |
| 🇵🇪 | **Yaku** | Demografía INEI, Cultura & Lengua Quechua | `gemma4:e2b` (3.2GB) |

---

## 🛠️ Arquitectura del Sistema

```text
Entorno del Usuario (Mac / Windows / Linux)
│
├── OLLAMA (Servidor de Modelos Locales)
│   ├── gemma4:e2b  (Modelo Rápido Conversacional ~3.2 GB)
│   ├── gemma4:12b  (Modelo Intermedio Salud/Código ~7.6 GB)
│   └── gemma4:e4b  (Modelo Razonador Legal/Emergencias ~9.6 GB)
│
└── CONTENEDORES DOCKER
    ├── maru_postgres  (PostgreSQL 16: Datos estructurados, hábitos, calendario)
    ├── maru_redis     (Redis 7: Caché de sesiones e intenciones)
    ├── maru_qdrant    (Qdrant: Base Vectorial RAG para memoria semántica)
    ├── maru_neo4j     (Neo4j 5: Grafo de conocimiento de salud y medicamentos)
    ├── maru_backend   (FastAPI + Python 3.12 en http://localhost:8000)
    └── maru_frontend  (React 19 + Vite + Tailwind en http://localhost:3000)
```

---

## 📋 Requisitos Previos (¿Qué debes descargar e instalar?)

Antes de comenzar, asegúrate de tener instalado en tu computadora:

1. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**: Necesario para ejecutar la base de datos, caché y servicios backend/frontend.
2. **[Node.js v20+](https://nodejs.org/)**: Para gestión de paquetes local si deseas compilar o desarrollar fuera de Docker.
3. **[Ollama](https://ollama.com/)**: Motor para ejecutar los modelos de inteligencia artificial de forma local en tu GPU/CPU.
4. **[Git](https://git-scm.com/)**: Para clonar el repositorio.

---

## 🚀 Guía de Instalación y Puesta en Marcha (Paso a Paso)

### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/revilo3681/maru-os.git
cd maru-os
```

### Paso 2: Descargar los Modelos Locales en Ollama
Abre una terminal en tu computadora y ejecuta los siguientes comandos para descargar los modelos necesarios:
```bash
# Modelo Rápido (Obligatorio)
ollama pull gemma4:e2b

# Modelos Avanzados para Razonamiento Profundo (Recomendados)
ollama pull gemma4:12b
ollama pull gemma4:e4b
```

> **Nota:** Verifica que Ollama esté corriendo ejecutando `ollama list` en tu consola.

### Paso 3: Configurar Archivos Multimedia (Opcional)
- Para la música de fondo de la portada, coloca tu archivo audio `musica-portada.mp3` en la raíz del proyecto o dentro de la carpeta `public/`. *(Por límites de peso en GitHub, los archivos `.mp3` no se suben al repositorio).*

### Paso 4: Levantar los Servicios con Docker Compose
Ejecuta el siguiente comando para construir y desplegar toda la infraestructura:
```bash
docker-compose up -d --build
```

### Paso 5: Abrir MARU OS
Abre tu navegador web e ingresa a:
👉 **`http://localhost:3000`**

---

## 💻 Desarrollo Local (Sin Docker)

Si prefieres ejecutar el frontend o backend de forma independiente para desarrollo:

### Backend (Python FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend (React + Vite)
```bash
npm install
npm run dev
```

---

## 🛠️ Comandos de Mantenimiento

- **Ver Estado de los Contenedores:**
  ```bash
  docker-compose ps
  ```
- **Ver Logs del Sistema:**
  ```bash
  docker-compose logs -f
  ```
- **Detener los Servicios:**
  ```bash
  docker-compose down
  ```

---

## 📄 Licencia
Desarrollado con ❤️ para empoderar la soberanía tecnológica, la privacidad y el bienestar local.
