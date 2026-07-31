// AUTOGENERADO desde backend/app/services/knowledge_base.py — índice ligero de la
// Base de Conocimiento Oficial de MARU OS para navegación offline (Memory view).
// El cuerpo completo de cada documento se obtiene de GET /api/knowledge.

import { AgentId } from '../types';

export interface KnowledgeDocMeta {
  id: string;
  title: string;
  /** Norma / fuente oficial real del documento */
  source: string;
  /** Agentes MARU propietarios del documento */
  agents: AgentId[];
  keywords: string[];
  /** Primer párrafo del documento (resumen) */
  summary: string;
}

export const KNOWLEDGE_BASE_INDEX: KnowledgeDocMeta[] = [
  {
    "id": "minsa-dengue-nts125",
    "title": "Dengue: diagnóstico y manejo clínico (MINSA)",
    "source": "NTS N° 125-MINSA/2016/CDC-DGIESP — Norma Técnica de Salud para la vigilancia y atención de casos de dengue en el Perú",
    "agents": [
      "aya",
      "tupac"
    ],
    "keywords": [
      "dengue",
      "zancudo",
      "aedes",
      "aegypti",
      "fiebre",
      "ibuprofeno",
      "aspirina",
      "aines",
      "paracetamol",
      "plaquetas",
      "hemorragia",
      "arbovirosis"
    ],
    "summary": "El dengue es una arbovirosis transmitida por el zancudo Aedes aegypti. Cuadro típico: fiebre alta (2-7 días), cefalea, dolor retroocular, mialgias, artralgias, erupción cutánea. Signos de alarma (requieren atención inmed"
  },
  {
    "id": "minsa-anemia-nts134",
    "title": "Anemia infantil y gestacional: prevención y tratamiento (MINSA)",
    "source": "NTS N° 134-MINSA/2017/DGIESP — Norma Técnica para el manejo terapéutico y preventivo de la anemia en niños, adolescentes, mujeres gestantes y puérperas (RM N° 250-2017/MINSA)",
    "agents": [
      "aya",
      "sumaq"
    ],
    "keywords": [
      "anemia",
      "hierro",
      "hemoglobina",
      "gestante",
      "embarazo",
      "niño",
      "lactante",
      "sulfato ferroso",
      "ferropenia",
      "micronutrientes",
      "suplemento"
    ],
    "summary": "La anemia por deficiencia de hierro se diagnostica con hemoglobina: en niños de 6-59 meses <11.0 g/dL; en gestantes (1er y 3er trimestre) <11.0 g/dL. Los valores se ajustan por altitud (a mayor altura, el punto de corte "
  },
  {
    "id": "minsa-tbc-nts104",
    "title": "Tuberculosis sensible y MDR: atención integral (MINSA)",
    "source": "NTS N° 104-MINSA/DGSP-V.01 — Norma Técnica de Salud para la Atención Integral de las Personas Afectadas por Tuberculosis (y modificatorias)",
    "agents": [
      "aya"
    ],
    "keywords": [
      "tuberculosis",
      "tbc",
      "tos",
      "baciloscopia",
      "mdr",
      "isoniacida",
      "rifampicina",
      "esquema",
      "contagio",
      "sintomatico respiratorio",
      "pulmones"
    ],
    "summary": "Sintomático respiratorio: toda persona con tos con flema por 15 días o más debe recibir evaluación gratuita con baciloscopía de esputo en cualquier establecimiento de salud. Diagnóstico: baciloscopía, cultivo y pruebas d"
  },
  {
    "id": "minsa-diabetes-gpc",
    "title": "Diabetes mellitus tipo 2: diagnóstico y tratamiento (MINSA)",
    "source": "Guía de Práctica Clínica para el Diagnóstico, Tratamiento y Control de la Diabetes Mellitus Tipo 2 en el Primer Nivel de Atención (RM N° 719-2015/MINSA)",
    "agents": [
      "aya",
      "sumaq"
    ],
    "keywords": [
      "diabetes",
      "glucosa",
      "glicemia",
      "metformina",
      "insulina",
      "hba1c",
      "azucar",
      "hiperglicemia",
      "hipoglicemia",
      "pie diabetico"
    ],
    "summary": "Diagnóstico de diabetes tipo 2 (cualquiera de los criterios): glucemia en ayunas ≥126 mg/dL (en dos ocasiones), glucemia ≥200 mg/dL a las 2 horas de una carga oral de 75 g de glucosa, HbA1c ≥6.5 %, o glucemia al azar ≥20"
  },
  {
    "id": "minsa-hipertension-gpc045",
    "title": "Hipertensión arterial: diagnóstico, tratamiento y control (MINSA)",
    "source": "Guía de Práctica Clínica N° 045: Diagnóstico, Tratamiento y Control de la Enfermedad Hipertensiva (RM N° 031-2015/MINSA)",
    "agents": [
      "aya"
    ],
    "keywords": [
      "hipertension",
      "presion arterial",
      "presion alta",
      "enalapril",
      "losartan",
      "sal",
      "sodio",
      "cardiovascular",
      "crisis hipertensiva"
    ],
    "summary": "Diagnóstico: presión arterial (PA) ≥140/90 mmHg confirmada en al menos dos mediciones correctas en dos visitas distintas (paciente sentado, en reposo ≥5 minutos, sin café ni tabaco previos)."
  },
  {
    "id": "minsa-soroche-altura",
    "title": "Mal agudo de montaña (soroche): prevención y manejo",
    "source": "MINSA — recomendaciones oficiales de salud del viajero a altura; consenso internacional (Lake Louise Score) para mal agudo de montaña",
    "agents": [
      "aya",
      "yaku"
    ],
    "keywords": [
      "soroche",
      "altura",
      "mal de montaña",
      "cusco",
      "puno",
      "huaraz",
      "oxigeno",
      "acetazolamida",
      "coca",
      "cefalea",
      "apunamiento"
    ],
    "summary": "El mal agudo de montaña (soroche) aparece típicamente sobre los 2,500 m s. n. m. (Cusco 3,399 m, Puno 3,827 m, Huaraz 3,052 m) por menor presión parcial de oxígeno. Síntomas: cefalea, náuseas, mareo, fatiga, insomnio, fa"
  },
  {
    "id": "minsa-covid19",
    "title": "COVID-19: prevención, manejo y signos de alarma",
    "source": "MINSA — documentos técnicos de manejo de COVID-19 en el Perú (RM N° 834-2021/MINSA y actualizaciones); recomendaciones OMS",
    "agents": [
      "aya"
    ],
    "keywords": [
      "covid",
      "coronavirus",
      "sars-cov-2",
      "vacuna",
      "mascarilla",
      "saturacion",
      "oximetro",
      "aislamiento",
      "antigeno"
    ],
    "summary": "El COVID-19 es causado por el virus SARS-CoV-2 y se transmite principalmente por vía respiratoria (aerosoles y gotículas). Síntomas frecuentes: fiebre, tos, dolor de garganta, malestar general, cefalea, pérdida de olfato"
  },
  {
    "id": "emg-rcp-basico",
    "title": "RCP básico en adultos (reanimación cardiopulmonar)",
    "source": "Guías AHA 2020 de RCP básico (soporte vital básico), adoptadas por MINSA/SAMU — Emergencias: SAMU 106, Bomberos 116",
    "agents": [
      "aya",
      "tupac"
    ],
    "keywords": [
      "rcp",
      "reanimacion",
      "paro cardiaco",
      "compresiones",
      "desfibrilador",
      "dea",
      "inconsciente",
      "no respira",
      "samu",
      "106",
      "116"
    ],
    "summary": "Cadena de supervivencia ante un adulto que no responde y no respira (o solo jadea/boquea):"
  },
  {
    "id": "emg-heimlich",
    "title": "Atragantamiento: maniobra de Heimlich (compresiones abdominales)",
    "source": "Guías AHA/Cruz Roja de primeros auxilios para obstrucción de la vía aérea por cuerpo extraño — Emergencias: SAMU 106",
    "agents": [
      "aya",
      "tupac"
    ],
    "keywords": [
      "heimlich",
      "atragantamiento",
      "asfixia",
      "ahogo",
      "via aerea",
      "obstruccion",
      "tos",
      "bebe",
      "atorado"
    ],
    "summary": "Obstrucción LEVE (la persona puede toser o hablar): animarla a seguir tosiendo con fuerza; no dar golpes ni maniobras todavía; vigilar de cerca."
  },
  {
    "id": "emg-loxosceles",
    "title": "Mordedura de araña casera (Loxosceles laeta) y suero antiloxoscélico",
    "source": "MINSA / Instituto Nacional de Salud (INS) — Norma y manejo de loxoscelismo en el Perú; el INS produce el suero antiloxoscélico",
    "agents": [
      "aya",
      "tupac"
    ],
    "keywords": [
      "arana",
      "loxosceles",
      "violinista",
      "violonchista",
      "mordedura",
      "suero",
      "antiloxoscelico",
      "loxoscelismo",
      "necrosis",
      "picadura"
    ],
    "summary": "La araña casera Loxosceles laeta ('araña violinista' o 'violonchista') vive dentro de las casas peruanas: rincones oscuros, detrás de cuadros y muebles, en ropa y zapatos guardados. Su mordedura causa loxoscelismo, una e"
  },
  {
    "id": "emg-huaico-indeci",
    "title": "Plan de evacuación por huaico o deslizamiento (INDECI)",
    "source": "INDECI — recomendaciones oficiales ante huaicos y deslizamientos (Plan Familiar de Emergencia) — Emergencias: INDECI/COEN 115, Bomberos 116, SAMU 106",
    "agents": [
      "tupac",
      "aya",
      "pacha"
    ],
    "keywords": [
      "huaico",
      "deslizamiento",
      "quebrada",
      "lluvia",
      "evacuacion",
      "indeci",
      "115",
      "mochila de emergencia",
      "zona segura",
      "lloclla",
      "chosica"
    ],
    "summary": "ANTES (preparación): identificar con la familia las zonas seguras y rutas de evacuación señalizadas por el municipio/INDECI (partes altas, alejadas del cauce de quebradas y ríos). Preparar la MOCHILA DE EMERGENCIA: agua "
  },
  {
    "id": "legal-constitucion",
    "title": "Constitución Política del Perú: dignidad, derechos, salud (Arts. 1, 2, 7, 9)",
    "source": "Constitución Política del Perú (1993) — Artículos 1, 2, 7 y 9",
    "agents": [
      "yaku",
      "inti"
    ],
    "keywords": [
      "constitucion",
      "derechos",
      "dignidad",
      "salud",
      "articulo",
      "igualdad",
      "vida",
      "persona",
      "estado",
      "politica nacional de salud"
    ],
    "summary": "Artículo 1: 'La defensa de la persona humana y el respeto de su dignidad son el fin supremo de la sociedad y del Estado.'"
  },
  {
    "id": "legal-ley26842-salud",
    "title": "Ley General de Salud N° 26842: emergencia obligatoria y consentimiento informado",
    "source": "Ley N° 26842, Ley General de Salud (1997) — Arts. 3 (modif. por Ley N° 27604), 4, 15 y 25",
    "agents": [
      "yaku",
      "inti",
      "aya"
    ],
    "keywords": [
      "ley general de salud",
      "26842",
      "emergencia",
      "atencion obligatoria",
      "consentimiento informado",
      "historia clinica",
      "paciente",
      "derechos del paciente",
      "confidencialidad"
    ],
    "summary": "ATENCIÓN DE EMERGENCIA OBLIGATORIA (Art. 3, modificado por Ley N° 27604): toda persona tiene derecho a recibir atención médico-quirúrgica de emergencia en cualquier establecimiento de salud, público o privado, cuando est"
  },
  {
    "id": "legal-ley29733-datos",
    "title": "Ley N° 29733 de Protección de Datos Personales: datos de salud como sensibles",
    "source": "Ley N° 29733, Ley de Protección de Datos Personales (2011) y su Reglamento (D.S. N° 003-2013-JUS; actualizado por D.S. N° 016-2024-JUS)",
    "agents": [
      "yaku",
      "inti",
      "kipu"
    ],
    "keywords": [
      "datos personales",
      "29733",
      "privacidad",
      "datos sensibles",
      "salud",
      "consentimiento",
      "arco",
      "habeas data",
      "proteccion de datos",
      "biometrico"
    ],
    "summary": "La Ley N° 29733 desarrolla el derecho fundamental a la protección de los datos personales (Constitución, Art. 2 inc. 6). Se aplica a todo tratamiento de datos en bancos de datos públicos o privados."
  },
  {
    "id": "clima-enfen-nino",
    "title": "Boletín ENFEN: El Niño / La Niña costeros y anomalías del mar peruano",
    "source": "Comisión Multisectorial ENFEN (IMARPE, SENAMHI, IGP, DHN, ANA, INDECI, CENEPRED) — Boletines y comunicados oficiales ENFEN",
    "agents": [
      "yaku",
      "pacha",
      "tupac"
    ],
    "keywords": [
      "el nino",
      "la nina",
      "enfen",
      "fenomeno",
      "mar",
      "temperatura",
      "anomalia",
      "lluvias",
      "costa",
      "icen",
      "senamhi",
      "imarpe",
      "clima"
    ],
    "summary": "La Comisión Multisectorial ENFEN (Estudio Nacional del Fenómeno El Niño) es el ente oficial peruano que monitorea y comunica el estado de El Niño y La Niña. Emite comunicados y boletines periódicos con niveles de alerta:"
  },
  {
    "id": "sismo-igp-monitoreo",
    "title": "Monitoreo sísmico del IGP: silencio sísmico de la costa central y preparación",
    "source": "Instituto Geofísico del Perú (IGP) — Centro Sismológico Nacional; INDECI (115) — recomendaciones oficiales de preparación sísmica",
    "agents": [
      "yaku",
      "pacha",
      "tupac"
    ],
    "keywords": [
      "sismo",
      "terremoto",
      "igp",
      "silencio sismico",
      "lima",
      "callao",
      "magnitud",
      "tsunami",
      "kit",
      "mochila de emergencia",
      "simulacro",
      "placa de nazca"
    ],
    "summary": "El Perú está en el Cinturón de Fuego del Pacífico: la placa de Nazca subduce bajo la placa Sudamericana, generando la mayor parte de los sismos del país. El IGP (Centro Sismológico Nacional) monitorea la actividad sísmic"
  },
  {
    "id": "kipu-formatos-ia",
    "title": "Guía de formatos de modelos de IA: GGUF, PyTorch/Transformers, ONNX, Keras 3, Flax/JAX",
    "source": "Documentación oficial: llama.cpp/GGUF (ggml-org), Hugging Face Transformers, ONNX Runtime, Keras 3, Flax/JAX",
    "agents": [
      "kipu"
    ],
    "keywords": [
      "gguf",
      "ollama",
      "llama.cpp",
      "onnx",
      "pytorch",
      "transformers",
      "huggingface",
      "keras",
      "jax",
      "flax",
      "cuantizacion",
      "modelo",
      "formato",
      "inferencia",
      "webgpu",
      "tpu",
      "gpu",
      "vllm"
    ],
    "summary": "GGUF (llama.cpp / Ollama): formato binario de ggml para inferencia LOCAL en CPU/RAM (con offload opcional a GPU/Metal). Empaqueta pesos cuantizados (Q4_0, Q4_K_M, Q8_0…) y metadatos en un solo archivo. Ideal para laptops"
  },
  {
    "id": "kipu-buenas-practicas",
    "title": "Buenas prácticas de código limpio",
    "source": "Robert C. Martin, 'Clean Code' (2008); Andrew Hunt & David Thomas, 'The Pragmatic Programmer' (1999); PEP 8 (Python)",
    "agents": [
      "kipu"
    ],
    "keywords": [
      "clean code",
      "codigo limpio",
      "buenas practicas",
      "refactor",
      "nombres",
      "funciones",
      "dry",
      "kiss",
      "yagni",
      "test",
      "pep8",
      "legibilidad"
    ],
    "summary": "Principios centrales del código limpio:"
  },
  {
    "id": "kipu-solid-patrones",
    "title": "SOLID y patrones de diseño GoF esenciales",
    "source": "Robert C. Martin — principios SOLID; Gamma, Helm, Johnson, Vlissides (GoF), 'Design Patterns: Elements of Reusable Object-Oriented Software' (1994)",
    "agents": [
      "kipu"
    ],
    "keywords": [
      "solid",
      "patrones",
      "design patterns",
      "singleton",
      "factory",
      "observer",
      "strategy",
      "adapter",
      "decorator",
      "gof",
      "arquitectura",
      "oop",
      "poo"
    ],
    "summary": "SOLID:"
  },
  {
    "id": "kipu-estructuras-algoritmos",
    "title": "Estructuras de datos y algoritmos fundamentales",
    "source": "Cormen, Leiserson, Rivest, Stein — 'Introduction to Algorithms' (CLRS, MIT Press); análisis asintótico estándar",
    "agents": [
      "kipu"
    ],
    "keywords": [
      "algoritmos",
      "estructuras de datos",
      "complejidad",
      "big o",
      "hash",
      "arbol",
      "grafo",
      "ordenamiento",
      "busqueda binaria",
      "lista enlazada",
      "pila",
      "cola",
      "quicksort",
      "dijkstra"
    ],
    "summary": "Estructuras fundamentales y sus costos típicos (notación Big-O):"
  }
];
