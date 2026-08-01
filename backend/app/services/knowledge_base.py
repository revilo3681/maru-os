"""
MARU OS — Base de Conocimiento Oficial (offline).

Documentos concisos pero FIELES a fuentes oficiales peruanas e internacionales
(MINSA, INDECI, IGP, ENFEN/SENAMHI, Constitución, leyes vigentes) y a
documentación técnica real de formatos de modelos de IA y programación.

Cada documento tiene:
  - id: identificador único
  - title: título del documento
  - source: norma / fuente oficial real
  - agents: agentes MARU propietarios (filtran la recuperación RAG)
  - keywords: palabras clave para recuperación léxica
  - body: resumen fiel del contenido oficial (sin inventar citas)

Incluye recuperación léxica 100% offline (sin Qdrant/Ollama):
normalización de acentos, tokenización y scoring por solapamiento
de keywords, título y cuerpo.
"""

import json
import re
import unicodedata
from pathlib import Path
from typing import Any, Dict, List, Optional

# ══════════════════════════════════════════════════════════════════
#  Documentos oficiales
# ══════════════════════════════════════════════════════════════════

KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    # ── MINSA · Guías clínicas (AYA) ──────────────────────────────
    {
        "id": "minsa-dengue-nts125",
        "title": "Dengue: diagnóstico y manejo clínico (MINSA)",
        "source": "NTS N° 125-MINSA/2016/CDC-DGIESP — Norma Técnica de Salud para la vigilancia y atención de casos de dengue en el Perú",
        "agents": ["aya", "tupac"],
        "keywords": ["dengue", "zancudo", "aedes", "aegypti", "fiebre", "ibuprofeno", "aspirina", "aines", "paracetamol", "plaquetas", "hemorragia", "arbovirosis"],
        "body": (
            "El dengue es una arbovirosis transmitida por el zancudo Aedes aegypti. Cuadro típico: fiebre alta "
            "(2-7 días), cefalea, dolor retroocular, mialgias, artralgias, erupción cutánea. "
            "Signos de alarma (requieren atención inmediata): dolor abdominal intenso y continuo, vómitos persistentes, "
            "sangrado de mucosas, letargia o irritabilidad, acumulación de líquidos, hepatomegalia >2 cm, aumento del "
            "hematocrito con caída rápida de plaquetas.\n"
            "REGLA CRÍTICA DE SEGURIDAD: en caso de dengue probable o confirmado está PROHIBIDO usar AINEs "
            "(ibuprofeno, naproxeno), aspirina (ácido acetilsalicílico) o corticoides, porque aumentan el riesgo de "
            "sangrado y gastritis hemorrágica. El único antipirético/analgésico indicado es PARACETAMOL "
            "(adultos: 500 mg - 1 g cada 6 horas, máx. 4 g/día). No se usan antibióticos ni antivirales específicos.\n"
            "Manejo grupo A (sin signos de alarma): hidratación oral abundante, paracetamol, reposo, control diario y "
            "búsqueda activa de signos de alarma. Grupo B (con signos de alarma o comorbilidad): observación/hospitalización "
            "con hidratación endovenosa. Grupo C (dengue grave): emergencia — choque, sangrado grave o daño de órganos; "
            "manejo en UCI. Prevención: eliminar criaderos (recipientes con agua), uso de repelente y ropa de manga larga. "
            "Ante sospecha, acudir al establecimiento de salud más cercano; no automedicarse."
        ),
    },
    {
        "id": "minsa-anemia-nts134",
        "title": "Anemia infantil y gestacional: prevención y tratamiento (MINSA)",
        "source": "NTS N° 134-MINSA/2017/DGIESP — Norma Técnica para el manejo terapéutico y preventivo de la anemia en niños, adolescentes, mujeres gestantes y puérperas (RM N° 250-2017/MINSA)",
        "agents": ["aya", "sumaq"],
        "keywords": ["anemia", "hierro", "hemoglobina", "gestante", "embarazo", "niño", "lactante", "sulfato ferroso", "ferropenia", "micronutrientes", "suplemento"],
        "body": (
            "La anemia por deficiencia de hierro se diagnostica con hemoglobina: en niños de 6-59 meses <11.0 g/dL; "
            "en gestantes (1er y 3er trimestre) <11.0 g/dL. Los valores se ajustan por altitud (a mayor altura, el punto "
            "de corte sube).\n"
            "Tratamiento en niños de 6 meses a 11 años con anemia: hierro a dosis de 3 mg/kg/día (sulfato ferroso o "
            "complejo polimaltosado) durante 6 meses continuos, con control de hemoglobina al mes, a los 3 y a los 6 meses. "
            "Prevención en niños de 4-35 meses: suplementación con hierro en gotas/jarabe o micronutrientes en polvo "
            "('chispitas').\n"
            "Gestantes: suplementación preventiva con hierro (60 mg de hierro elemental) + ácido fólico (400 µg) desde la "
            "semana 14 hasta 30 días posparto; si hay anemia, dosis terapéutica de 120 mg de hierro elemental/día y control "
            "prenatal reforzado.\n"
            "Recomendaciones dietéticas oficiales: consumir alimentos ricos en hierro hemínico — sangrecita, bazo, hígado, "
            "carnes rojas, pescado oscuro — acompañados de vitamina C (cítricos) para mejorar absorción; evitar tomar el "
            "hierro junto con té, café o lácteos, que inhiben su absorción. El tamizaje y el suplemento se entregan "
            "gratuitamente en los establecimientos de salud MINSA."
        ),
    },
    {
        "id": "minsa-tbc-nts104",
        "title": "Tuberculosis sensible y MDR: atención integral (MINSA)",
        "source": "NTS N° 104-MINSA/DGSP-V.01 — Norma Técnica de Salud para la Atención Integral de las Personas Afectadas por Tuberculosis (y modificatorias)",
        "agents": ["aya"],
        "keywords": ["tuberculosis", "tbc", "tos", "baciloscopia", "mdr", "isoniacida", "rifampicina", "esquema", "contagio", "sintomatico respiratorio", "pulmones"],
        "body": (
            "Sintomático respiratorio: toda persona con tos con flema por 15 días o más debe recibir evaluación gratuita "
            "con baciloscopía de esputo en cualquier establecimiento de salud. Diagnóstico: baciloscopía, cultivo y pruebas "
            "de sensibilidad rápida (para detectar resistencia a isoniacida y rifampicina).\n"
            "TBC sensible — Esquema para adultos: 2 meses de fase intensiva con isoniacida (H), rifampicina (R), "
            "pirazinamida (Z) y etambutol (E) en dosis diaria, seguidos de 4 meses de fase de continuación con isoniacida "
            "y rifampicina (2HRZE/4H3R3 según norma). El tratamiento es GRATUITO y estrictamente supervisado (DOT: el "
            "personal de salud observa la toma de cada dosis).\n"
            "TBC MDR (multidrogorresistente, resistente al menos a isoniacida y rifampicina): requiere esquemas "
            "individualizados más prolongados con fármacos de segunda línea (p. ej. levofloxacino, bedaquilina, linezolid), "
            "aprobados por el Comité Regional/Nacional de Evaluación de Retratamientos.\n"
            "Nunca abandonar el tratamiento: el abandono genera resistencia. Se debe estudiar a los contactos del hogar. "
            "Medidas de control: ventilación de ambientes, cubrirse al toser, y quimioprofilaxis con isoniacida en "
            "contactos menores de 5 años según evaluación médica."
        ),
    },
    {
        "id": "minsa-diabetes-gpc",
        "title": "Diabetes mellitus tipo 2: diagnóstico y tratamiento (MINSA)",
        "source": "Guía de Práctica Clínica para el Diagnóstico, Tratamiento y Control de la Diabetes Mellitus Tipo 2 en el Primer Nivel de Atención (RM N° 719-2015/MINSA)",
        "agents": ["aya", "sumaq"],
        "keywords": ["diabetes", "glucosa", "glicemia", "metformina", "insulina", "hba1c", "azucar", "hiperglicemia", "hipoglicemia", "pie diabetico"],
        "body": (
            "Diagnóstico de diabetes tipo 2 (cualquiera de los criterios): glucemia en ayunas ≥126 mg/dL (en dos "
            "ocasiones), glucemia ≥200 mg/dL a las 2 horas de una carga oral de 75 g de glucosa, HbA1c ≥6.5 %, o glucemia "
            "al azar ≥200 mg/dL con síntomas clásicos (poliuria, polidipsia, pérdida de peso).\n"
            "Tratamiento de primera línea: cambios en el estilo de vida (alimentación saludable, reducción de azúcares "
            "simples, actividad física ≥150 min/semana, control de peso) + METFORMINA como fármaco inicial de elección, "
            "comenzando con dosis bajas junto a las comidas para reducir molestias gastrointestinales. Si no se alcanza la "
            "meta, se añade una sulfonilurea u otro agente, y se considera insulina cuando hay hiperglucemia marcada o "
            "falla del tratamiento oral.\n"
            "Meta de control general: HbA1c <7 % (individualizar en adultos mayores). Control periódico de presión "
            "arterial, perfil lipídico, función renal (creatinina, microalbuminuria), examen de pies (prevención de pie "
            "diabético) y fondo de ojo anual.\n"
            "Signos de alarma para acudir de inmediato a un establecimiento de salud: glucemias muy altas con vómitos o "
            "deshidratación, heridas en pies que no cicatrizan, o síntomas de hipoglucemia severa (sudoración, temblor, "
            "confusión) en usuarios de insulina o sulfonilureas."
        ),
    },
    {
        "id": "minsa-hipertension-gpc045",
        "title": "Hipertensión arterial: diagnóstico, tratamiento y control (MINSA)",
        "source": "Guía de Práctica Clínica N° 045: Diagnóstico, Tratamiento y Control de la Enfermedad Hipertensiva (RM N° 031-2015/MINSA)",
        "agents": ["aya"],
        "keywords": ["hipertension", "presion arterial", "presion alta", "enalapril", "losartan", "sal", "sodio", "cardiovascular", "crisis hipertensiva"],
        "body": (
            "Diagnóstico: presión arterial (PA) ≥140/90 mmHg confirmada en al menos dos mediciones correctas en dos "
            "visitas distintas (paciente sentado, en reposo ≥5 minutos, sin café ni tabaco previos).\n"
            "Tratamiento no farmacológico (para todos): reducir el consumo de sal a menos de 5 g/día, dieta rica en frutas "
            "y verduras, actividad física regular (≥150 min/semana), mantener peso saludable, no fumar y moderar el alcohol.\n"
            "Tratamiento farmacológico de primera línea disponible en el primer nivel de atención: inhibidores de la ECA "
            "(enalapril) o antagonistas de los receptores de angiotensina II (losartán); como alternativas, diuréticos "
            "tiazídicos o calcioantagonistas (amlodipino), solos o combinados según respuesta y comorbilidad. Meta general: "
            "PA <140/90 mmHg (más estricta en pacientes con diabetes o enfermedad renal según evaluación médica).\n"
            "Crisis hipertensiva (PA ≥180/110-120 mmHg): si hay síntomas como dolor torácico, dificultad respiratoria, "
            "déficit neurológico o visión borrosa, es una EMERGENCIA — llamar al SAMU 106 o acudir de inmediato al "
            "establecimiento de salud. El tratamiento es de por vida y no debe suspenderse sin indicación médica."
        ),
    },
    {
        "id": "minsa-soroche-altura",
        "title": "Mal agudo de montaña (soroche): prevención y manejo",
        "source": "MINSA — recomendaciones oficiales de salud del viajero a altura; consenso internacional (Lake Louise Score) para mal agudo de montaña",
        "agents": ["aya", "yaku"],
        "keywords": ["soroche", "altura", "mal de montaña", "cusco", "puno", "huaraz", "oxigeno", "acetazolamida", "coca", "cefalea", "apunamiento"],
        "body": (
            "El mal agudo de montaña (soroche) aparece típicamente sobre los 2,500 m s. n. m. (Cusco 3,399 m, Puno 3,827 m, "
            "Huaraz 3,052 m) por menor presión parcial de oxígeno. Síntomas: cefalea, náuseas, mareo, fatiga, insomnio, "
            "falta de apetito; suele iniciar entre 6 y 12 horas tras el ascenso.\n"
            "Prevención: ascenso gradual (idealmente pernoctar a altura intermedia), evitar esfuerzos intensos y alcohol "
            "las primeras 24-48 horas, hidratarse bien y comer ligero. El mate o la hoja de coca son de uso tradicional "
            "para aliviar síntomas leves. En personas con antecedentes o ascensos rápidos, el médico puede indicar "
            "acetazolamida preventiva (125-250 mg cada 12 h iniciando el día previo al ascenso); contraindicada en "
            "alérgicos a sulfas.\n"
            "Manejo de síntomas leves: reposo, hidratación, analgésicos simples (paracetamol) y no seguir ascendiendo "
            "hasta mejorar. SIGNOS DE GRAVEDAD (edema cerebral o pulmonar de altura): dificultad respiratoria en reposo, "
            "tos con esputo espumoso o rosado, confusión, marcha inestable o somnolencia extrema — es una emergencia: "
            "administrar oxígeno si está disponible y DESCENDER de inmediato al menos 500-1,000 m, y llamar al SAMU 106. "
            "Personas con cardiopatía, EPOC o anemia severa deben consultar al médico antes de viajar a altura."
        ),
    },
    {
        "id": "minsa-covid19",
        "title": "COVID-19: prevención, manejo y signos de alarma",
        "source": "MINSA — documentos técnicos de manejo de COVID-19 en el Perú (RM N° 834-2021/MINSA y actualizaciones); recomendaciones OMS",
        "agents": ["aya"],
        "keywords": ["covid", "coronavirus", "sars-cov-2", "vacuna", "mascarilla", "saturacion", "oximetro", "aislamiento", "antigeno"],
        "body": (
            "El COVID-19 es causado por el virus SARS-CoV-2 y se transmite principalmente por vía respiratoria (aerosoles "
            "y gotículas). Síntomas frecuentes: fiebre, tos, dolor de garganta, malestar general, cefalea, pérdida de olfato "
            "o gusto. El diagnóstico se confirma con prueba de antígeno o RT-PCR.\n"
            "Manejo de casos leves (la mayoría): aislamiento domiciliario, reposo, hidratación abundante y paracetamol "
            "para fiebre o malestar. NO están indicados antibióticos de rutina, ivermectina ni hidroxicloroquina (sin "
            "evidencia de beneficio según MINSA/OMS). Monitorizar la saturación de oxígeno con pulsioxímetro si está "
            "disponible.\n"
            "SIGNOS DE ALARMA — acudir de inmediato a un establecimiento de salud o llamar al 113 (línea MINSA) / "
            "SAMU 106: dificultad para respirar, saturación de oxígeno menor a 94 %, dolor u opresión persistente en el "
            "pecho, confusión o labios/cara azulados.\n"
            "Prevención: vacunación completa y refuerzos según esquema vigente del MINSA (gratuita), ventilación de "
            "ambientes cerrados, lavado de manos y uso de mascarilla en entornos de riesgo o con síntomas respiratorios. "
            "Grupos de riesgo (adultos mayores, gestantes, inmunosuprimidos, enfermedades crónicas) deben consultar "
            "precozmente ante síntomas."
        ),
    },

    # ── Protocolos de primera respuesta (AYA / TUPAC) ─────────────
    {
        "id": "emg-rcp-basico",
        "title": "RCP básico en adultos (reanimación cardiopulmonar)",
        "source": "Guías AHA 2020 de RCP básico (soporte vital básico), adoptadas por MINSA/SAMU — Emergencias: SAMU 106, Bomberos 116",
        "agents": ["aya", "tupac"],
        "keywords": ["rcp", "reanimacion", "paro cardiaco", "compresiones", "desfibrilador", "dea", "inconsciente", "no respira", "samu", "106", "116"],
        "body": (
            "Cadena de supervivencia ante un adulto que no responde y no respira (o solo jadea/boquea):\n"
            "1) Verificar seguridad de la escena. 2) Comprobar respuesta (hablarle, estimular hombros). 3) LLAMAR AL "
            "SAMU 106 (o Bomberos 116) y pedir un DEA (desfibrilador externo automático) si hay alguno cerca.\n"
            "4) Iniciar compresiones torácicas de inmediato: centro del pecho (mitad inferior del esternón), con el talón "
            "de una mano y la otra encima, brazos rectos; profundidad de 5-6 cm; frecuencia de 100 a 120 compresiones por "
            "minuto; permitir la reexpansión completa del tórax entre compresiones y minimizar interrupciones.\n"
            "5) Si está entrenado: 30 compresiones y 2 ventilaciones (30:2). Si no está entrenado o no puede ventilar, "
            "hacer RCP solo con las manos (compresiones continuas) — también salva vidas.\n"
            "6) En cuanto llegue el DEA, encenderlo y seguir sus instrucciones de voz: descarga si la indica y reanudar "
            "compresiones inmediatamente después.\n"
            "No detener la RCP hasta que la persona respire o se mueva, llegue ayuda profesional, o el rescatista esté "
            "exhausto. En posible sobredosis o ahogamiento, las ventilaciones son especialmente importantes."
        ),
    },
    {
        "id": "emg-heimlich",
        "title": "Atragantamiento: maniobra de Heimlich (compresiones abdominales)",
        "source": "Guías AHA/Cruz Roja de primeros auxilios para obstrucción de la vía aérea por cuerpo extraño — Emergencias: SAMU 106",
        "agents": ["aya", "tupac"],
        "keywords": ["heimlich", "atragantamiento", "asfixia", "ahogo", "via aerea", "obstruccion", "tos", "bebe", "atorado"],
        "body": (
            "Obstrucción LEVE (la persona puede toser o hablar): animarla a seguir tosiendo con fuerza; no dar golpes ni "
            "maniobras todavía; vigilar de cerca.\n"
            "Obstrucción GRAVE en adulto o niño mayor de 1 año (no puede hablar, toser ni respirar; se lleva las manos al "
            "cuello): pedir que alguien llame al SAMU 106 y actuar de inmediato con la maniobra de Heimlich: colocarse "
            "detrás de la persona, rodear su cintura con los brazos, poner un puño con el pulgar hacia adentro justo por "
            "encima del ombligo (debajo del esternón), sujetar el puño con la otra mano y realizar compresiones bruscas "
            "hacia adentro y hacia arriba, repitiendo hasta que expulse el objeto o pierda el conocimiento. Alternativa "
            "recomendada: alternar 5 golpes secos entre los omóplatos con 5 compresiones abdominales.\n"
            "En gestantes o personas con obesidad: compresiones en el centro del pecho (torácicas), no abdominales.\n"
            "En bebés menores de 1 año: NO hacer Heimlich; sostener al bebé boca abajo sobre el antebrazo y dar 5 golpes "
            "entre los omóplatos, luego voltear y dar 5 compresiones torácicas con dos dedos, alternando.\n"
            "Si la persona queda inconsciente: bajarla al suelo con cuidado e iniciar RCP, revisando la boca antes de "
            "cada ventilación."
        ),
    },
    {
        "id": "emg-loxosceles",
        "title": "Mordedura de araña casera (Loxosceles laeta) y suero antiloxoscélico",
        "source": "MINSA / Instituto Nacional de Salud (INS) — Norma y manejo de loxoscelismo en el Perú; el INS produce el suero antiloxoscélico",
        "agents": ["aya", "tupac"],
        "keywords": ["arana", "loxosceles", "violinista", "violonchista", "mordedura", "suero", "antiloxoscelico", "loxoscelismo", "necrosis", "picadura"],
        "body": (
            "La araña casera Loxosceles laeta ('araña violinista' o 'violonchista') vive dentro de las casas peruanas: "
            "rincones oscuros, detrás de cuadros y muebles, en ropa y zapatos guardados. Su mordedura causa loxoscelismo, "
            "una emergencia médica.\n"
            "Formas clínicas: CUTÁNEA (la más frecuente, ~85 %): dolor creciente, enrojecimiento y una placa violácea "
            "('placa livedoide') que puede evolucionar a necrosis de la piel en 24-72 horas. CUTÁNEO-VISCERAL (grave, "
            "~15 %): además, en las primeras 24-48 h aparecen orina oscura (color coca-cola), ictericia, fiebre y anemia "
            "por hemólisis; puede causar falla renal y muerte.\n"
            "Primeros auxilios: lavar la zona con agua y jabón, aplicar frío local, retirar anillos/pulseras, NO cortar, "
            "NO succionar, NO aplicar torniquetes ni emplastos, y si es posible capturar la araña (incluso aplastada) para "
            "identificación. ACUDIR DE INMEDIATO al establecimiento de salud u hospital — llamar al SAMU 106 si es grave.\n"
            "Tratamiento específico: SUERO ANTILOXOSCÉLICO producido por el Instituto Nacional de Salud (INS), más eficaz "
            "dentro de las primeras horas tras la mordedura; disponible en hospitales de referencia. Vigilar el color de "
            "la orina las primeras 48 horas. Prevención: sacudir ropa, zapatos y camas antes de usarlos, limpiar detrás de "
            "muebles y cuadros."
        ),
    },
    {
        "id": "emg-huaico-indeci",
        "title": "Plan de evacuación por huaico o deslizamiento (INDECI)",
        "source": "INDECI — recomendaciones oficiales ante huaicos y deslizamientos (Plan Familiar de Emergencia) — Emergencias: INDECI/COEN 115, Bomberos 116, SAMU 106",
        "agents": ["tupac", "aya", "pacha"],
        "keywords": ["huaico", "deslizamiento", "quebrada", "lluvia", "evacuacion", "indeci", "115", "mochila de emergencia", "zona segura", "lloclla", "chosica"],
        "body": (
            "ANTES (preparación): identificar con la familia las zonas seguras y rutas de evacuación señalizadas por el "
            "municipio/INDECI (partes altas, alejadas del cauce de quebradas y ríos). Preparar la MOCHILA DE EMERGENCIA: "
            "agua (2 L por persona), alimentos no perecibles, linterna, radio a pilas, botiquín, medicamentos personales, "
            "copia de documentos (DNI), abrigo, silbato y efectivo. Acordar un punto de reunión familiar. En temporada de "
            "lluvias (diciembre-abril, especialmente en quebradas como las de Chosica), estar atentos a las alertas de "
            "SENAMHI e INDECI.\n"
            "DURANTE: al escuchar la alarma o un ruido creciente desde la quebrada (piedras, agua), EVACUAR DE INMEDIATO "
            "hacia las zonas altas por las rutas establecidas, sin regresar por pertenencias. Nunca cruzar el cauce ni "
            "intentar atravesar el flujo de lodo a pie o en vehículo. Alejarse de postes y cables eléctricos.\n"
            "DESPUÉS: permanecer en la zona segura hasta el anuncio oficial; no ingresar a viviendas afectadas hasta su "
            "evaluación; hervir o desinfectar el agua antes de consumirla; reportar personas heridas o atrapadas.\n"
            "Números de emergencia: INDECI/COEN 115, Bomberos 116, SAMU 106, Policía Nacional 105."
        ),
    },

    # ── Legal / Constitución (YAKU / INTI) ────────────────────────
    {
        "id": "legal-constitucion",
        "title": "Constitución Política del Perú: dignidad, derechos, salud (Arts. 1, 2, 7, 9)",
        "source": "Constitución Política del Perú (1993) — Artículos 1, 2, 7 y 9",
        "agents": ["yaku", "inti"],
        "keywords": ["constitucion", "derechos", "dignidad", "salud", "articulo", "igualdad", "vida", "persona", "estado", "politica nacional de salud"],
        "body": (
            "Artículo 1: 'La defensa de la persona humana y el respeto de su dignidad son el fin supremo de la sociedad "
            "y del Estado.'\n"
            "Artículo 2 (derechos fundamentales de la persona, selección): toda persona tiene derecho a la vida, a su "
            "identidad, a su integridad moral, psíquica y física y a su libre desarrollo y bienestar (inc. 1); a la "
            "igualdad ante la ley, sin discriminación por origen, raza, sexo, idioma, religión, opinión, condición "
            "económica o de cualquier otra índole (inc. 2); a la libertad de conciencia y de religión (inc. 3); a las "
            "libertades de información, opinión, expresión y difusión (inc. 4); y a que los servicios informáticos no "
            "suministren informaciones que afecten la intimidad personal y familiar (inc. 6).\n"
            "Artículo 7: 'Todos tienen derecho a la protección de su salud, la del medio familiar y la de la comunidad, "
            "así como el deber de contribuir a su promoción y defensa. La persona incapacitada para velar por sí misma a "
            "causa de una deficiencia física o mental tiene derecho al respeto de su dignidad y a un régimen legal de "
            "protección, atención, readaptación y seguridad.'\n"
            "Artículo 9: 'El Estado determina la política nacional de salud. El Poder Ejecutivo norma y supervisa su "
            "aplicación. Es responsable de diseñarla y conducirla en forma plural y descentralizadora para facilitar a "
            "todos el acceso equitativo a los servicios de salud.'"
        ),
    },
    {
        "id": "legal-ley26842-salud",
        "title": "Ley General de Salud N° 26842: emergencia obligatoria y consentimiento informado",
        "source": "Ley N° 26842, Ley General de Salud (1997) — Arts. 3 (modif. por Ley N° 27604), 4, 15 y 25",
        "agents": ["yaku", "inti", "aya"],
        "keywords": ["ley general de salud", "26842", "emergencia", "atencion obligatoria", "consentimiento informado", "historia clinica", "paciente", "derechos del paciente", "confidencialidad"],
        "body": (
            "ATENCIÓN DE EMERGENCIA OBLIGATORIA (Art. 3, modificado por Ley N° 27604): toda persona tiene derecho a "
            "recibir atención médico-quirúrgica de emergencia en cualquier establecimiento de salud, público o privado, "
            "cuando esté en riesgo grave su vida o su salud. Ningún establecimiento puede negar la atención de emergencia "
            "ni condicionarla a pago previo, garantía o trámite administrativo mientras subsista el estado grave de "
            "riesgo.\n"
            "CONSENTIMIENTO INFORMADO (Art. 4): ninguna persona puede ser sometida a tratamiento médico o quirúrgico sin "
            "su consentimiento previo, o el de la persona llamada legalmente a darlo. Se exceptúan las intervenciones de "
            "emergencia.\n"
            "DERECHOS DEL USUARIO (Art. 15): toda persona usuaria de los servicios de salud tiene derecho, entre otros, "
            "al respeto de su personalidad, dignidad e intimidad; a exigir la reserva de la información relacionada con "
            "el acto médico y su historia clínica; a no ser objeto de experimentación sin su consentimiento; a que se le "
            "brinde información veraz, oportuna y completa sobre su diagnóstico, tratamiento, riesgos y alternativas; y a "
            "negarse a recibir o continuar un tratamiento (con las excepciones de ley).\n"
            "CONFIDENCIALIDAD (Art. 25): la información sobre el acto médico es reservada; el profesional y el "
            "establecimiento están obligados a guardar esa reserva, con excepciones tasadas por ley (orden judicial, "
            "vigilancia epidemiológica, etc.)."
        ),
    },
    {
        "id": "legal-ley29733-datos",
        "title": "Ley N° 29733 de Protección de Datos Personales: datos de salud como sensibles",
        "source": "Ley N° 29733, Ley de Protección de Datos Personales (2011) y su Reglamento (D.S. N° 003-2013-JUS; actualizado por D.S. N° 016-2024-JUS)",
        "agents": ["yaku", "inti", "kipu"],
        "keywords": ["datos personales", "29733", "privacidad", "datos sensibles", "salud", "consentimiento", "arco", "habeas data", "proteccion de datos", "biometrico"],
        "body": (
            "La Ley N° 29733 desarrolla el derecho fundamental a la protección de los datos personales (Constitución, "
            "Art. 2 inc. 6). Se aplica a todo tratamiento de datos en bancos de datos públicos o privados.\n"
            "DATOS SENSIBLES: la ley califica como datos sensibles, entre otros, los datos de SALUD (física o mental), "
            "datos biométricos, origen racial y étnico, opiniones políticas, convicciones religiosas, y vida u orientación "
            "sexual. Su tratamiento exige CONSENTIMIENTO previo, expreso, informado, inequívoco y POR ESCRITO (o medio "
            "equivalente) del titular, salvo excepciones legales (p. ej., atención médica de emergencia o razones de "
            "salud pública previstas por ley).\n"
            "Principios rectores: legalidad, consentimiento, finalidad (los datos solo se usan para el fin informado), "
            "proporcionalidad, calidad, seguridad (medidas técnicas y organizativas adecuadas) y disposición de recurso.\n"
            "Derechos del titular (derechos 'ARCO'): Acceso a sus datos, Rectificación, Cancelación (supresión) y "
            "Oposición al tratamiento. Se ejercen gratuitamente ante el titular del banco de datos; en caso de negativa, "
            "cabe reclamo ante la Autoridad Nacional de Protección de Datos Personales (Ministerio de Justicia) o proceso "
            "de hábeas data.\n"
            "Implicancia práctica para MARU OS: el perfil de salud del usuario (alergias, medicamentos, condiciones) es "
            "dato sensible — debe procesarse localmente, con consentimiento y sin compartirse con terceros."
        ),
    },

    # ── Clima / sísmico (YAKU / PACHA) ────────────────────────────
    {
        "id": "clima-enfen-nino",
        "title": "Boletín ENFEN: El Niño / La Niña costeros y anomalías del mar peruano",
        "source": "Comisión Multisectorial ENFEN (IMARPE, SENAMHI, IGP, DHN, ANA, INDECI, CENEPRED) — Boletines y comunicados oficiales ENFEN",
        "agents": ["yaku", "pacha", "tupac"],
        "keywords": ["el nino", "la nina", "enfen", "fenomeno", "mar", "temperatura", "anomalia", "lluvias", "costa", "icen", "senamhi", "imarpe", "clima"],
        "body": (
            "La Comisión Multisectorial ENFEN (Estudio Nacional del Fenómeno El Niño) es el ente oficial peruano que "
            "monitorea y comunica el estado de El Niño y La Niña. Emite comunicados y boletines periódicos con niveles de "
            "alerta: 'No activo', 'Vigilancia de El Niño/La Niña costera' y 'Alerta de El Niño/La Niña costera'.\n"
            "EL NIÑO COSTERO: calentamiento anómalo del mar frente a la costa de Perú y Ecuador (región Niño 1+2). Se "
            "clasifica con el Índice Costero El Niño (ICEN), basado en la anomalía de la temperatura superficial del mar. "
            "Efectos típicos: lluvias intensas e inundaciones en la costa norte, huaicos en quebradas (como las de Lima "
            "este), afectación de la pesca (la anchoveta migra o profundiza al reducirse el afloramiento de aguas frías).\n"
            "LA NIÑA COSTERA: enfriamiento anómalo del mar; suele asociarse a déficit de lluvias en la costa y a veces "
            "mayores lluvias en la sierra sur.\n"
            "El mar peruano normalmente es frío por la Corriente de Humboldt y el afloramiento costero, lo que sustenta "
            "una de las pesquerías más productivas del mundo; por eso las anomalías térmicas (medidas en °C respecto al "
            "promedio climatológico) son el indicador clave que vigila ENFEN. Ante alertas ENFEN, INDECI y CENEPRED "
            "activan planes de preparación ante lluvias y huaicos."
        ),
    },
    {
        "id": "sismo-igp-monitoreo",
        "title": "Monitoreo sísmico del IGP: silencio sísmico de la costa central y preparación",
        "source": "Instituto Geofísico del Perú (IGP) — Centro Sismológico Nacional; INDECI (115) — recomendaciones oficiales de preparación sísmica",
        "agents": ["yaku", "pacha", "tupac"],
        "keywords": ["sismo", "terremoto", "igp", "silencio sismico", "lima", "callao", "magnitud", "tsunami", "kit", "mochila de emergencia", "simulacro", "placa de nazca"],
        "body": (
            "El Perú está en el Cinturón de Fuego del Pacífico: la placa de Nazca subduce bajo la placa Sudamericana, "
            "generando la mayor parte de los sismos del país. El IGP (Centro Sismológico Nacional) monitorea la actividad "
            "sísmica 24/7 y publica los parámetros oficiales de cada sismo (magnitud, epicentro, profundidad).\n"
            "SILENCIO SÍSMICO DE LA COSTA CENTRAL: frente a Lima y Callao existe una zona de acoplamiento sísmico que no "
            "libera energía significativa desde el gran terremoto de 1746. El IGP advierte que esa energía acumulada "
            "podría generar un sismo de magnitud en torno a 8.8, acompañado de tsunami en el litoral. No es posible "
            "predecir cuándo ocurrirá: la preparación es la única defensa.\n"
            "PREPARACIÓN (INDECI): identificar zonas seguras internas y externas; asegurar muebles altos; tener MOCHILA "
            "DE EMERGENCIA (agua, alimentos no perecibles, linterna, radio, botiquín, documentos, silbato, abrigo) y caja "
            "de reserva; participar en los simulacros nacionales. DURANTE el sismo: mantener la calma, alejarse de "
            "ventanas, ubicarse en zonas seguras; no usar ascensores. Si está cerca del mar y el sismo fue fuerte o "
            "prolongado: evacuar de inmediato hacia zonas altas por riesgo de tsunami sin esperar alerta oficial.\n"
            "Emergencias: INDECI/COEN 115; información sísmica oficial: IGP (www.gob.pe/igp)."
        ),
    },

    # ── Formatos de modelos de IA (KIPU) ──────────────────────────
    {
        "id": "kipu-formatos-ia",
        "title": "Guía de formatos de modelos de IA: GGUF, PyTorch/Transformers, ONNX, Keras 3, Flax/JAX",
        "source": "Documentación oficial: llama.cpp/GGUF (ggml-org), Hugging Face Transformers, ONNX Runtime, Keras 3, Flax/JAX",
        "agents": ["kipu"],
        "keywords": ["gguf", "ollama", "llama.cpp", "onnx", "pytorch", "transformers", "huggingface", "keras", "jax", "flax", "cuantizacion", "modelo", "formato", "inferencia", "webgpu", "tpu", "gpu", "vllm"],
        "body": (
            "GGUF (llama.cpp / Ollama): formato binario de ggml para inferencia LOCAL en CPU/RAM (con offload opcional a "
            "GPU/Metal). Empaqueta pesos cuantizados (Q4_0, Q4_K_M, Q8_0…) y metadatos en un solo archivo. Ideal para "
            "laptops y equipos de consumo — es el formato que usa MARU OS con Ollama (los gemma4 locales son GGUF Q4). "
            "Regla práctica: un modelo Q4 necesita ~0.6 GB de RAM por cada mil millones de parámetros, más el contexto.\n"
            "Transformers / PyTorch (Hugging Face): pesos en safetensors/PyTorch con precisión completa (FP16/BF16). Es "
            "el formato de referencia para FINE-TUNING y entrenamiento en GPU (CUDA/ROCm) y para servir a escala con vLLM. "
            "Requiere típicamente 2 GB de VRAM por cada mil millones de parámetros en FP16.\n"
            "ONNX (ONNX Runtime): grafo portable e interoperable. Corre en NAVEGADOR (WebGPU/WASM con onnxruntime-web), "
            "en ANDROID/iOS (onnxruntime-mobile) y en C#/.NET, C++ y Java. Ideal para desplegar el mismo modelo en muchas "
            "plataformas sin dependencias de Python.\n"
            "Keras 3: API de alto nivel MULTI-BACKEND — el mismo código corre sobre JAX, TensorFlow o PyTorch. Buena "
            "opción didáctica y para prototipos que luego migran de backend sin reescribir.\n"
            "Flax/JAX: librería de redes neuronales sobre JAX (compilación XLA, transformaciones jit/grad/vmap/pmap). Es "
            "el estándar para ENTRENAMIENTO MASIVO en TPU y clústeres (así se entrenaron los modelos Gemma de Google).\n"
            "Resumen por hardware: CPU/RAM local → GGUF; GPU para fine-tuning/serving → PyTorch+vLLM; navegador/Android/"
            "C# → ONNX; multi-backend → Keras 3; TPU/investigación a gran escala → Flax/JAX."
        ),
    },

    # ── Programación (KIPU) ───────────────────────────────────────
    {
        "id": "kipu-buenas-practicas",
        "title": "Buenas prácticas de código limpio",
        "source": "Robert C. Martin, 'Clean Code' (2008); Andrew Hunt & David Thomas, 'The Pragmatic Programmer' (1999); PEP 8 (Python)",
        "agents": ["kipu"],
        "keywords": ["clean code", "codigo limpio", "buenas practicas", "refactor", "nombres", "funciones", "dry", "kiss", "yagni", "test", "pep8", "legibilidad"],
        "body": (
            "Principios centrales del código limpio:\n"
            "NOMBRES: usar nombres que revelen intención (`elapsed_days` mejor que `d`); funciones con verbos, clases con "
            "sustantivos; evitar abreviaturas crípticas y comentarios que solo repiten el código — el mejor comentario es "
            "el que no hace falta.\n"
            "FUNCIONES: pequeñas, que hagan UNA sola cosa y a un solo nivel de abstracción; pocos parámetros (idealmente "
            "≤3); sin efectos secundarios ocultos; preferir retornos tempranos a anidamientos profundos.\n"
            "DRY (Don't Repeat Yourself): cada pieza de conocimiento debe tener una representación única y autoritativa "
            "en el sistema — la duplicación multiplica los bugs. KISS (Keep It Simple): la solución más simple que "
            "funciona suele ser la correcta. YAGNI (You Aren't Gonna Need It): no construir funcionalidad especulativa "
            "'por si acaso'.\n"
            "ERRORES: usar excepciones en lugar de códigos de retorno; no silenciar errores (nunca un `except` vacío); "
            "fallar rápido y con mensajes útiles.\n"
            "PRUEBAS: tests automatizados como red de seguridad para refactorizar; regla F.I.R.S.T. — rápidos (Fast), "
            "independientes (Independent), repetibles (Repeatable), autoverificables (Self-validating), oportunos "
            "(Timely). La regla del Boy Scout: dejar el código un poco más limpio de como lo encontraste.\n"
            "En Python, seguir PEP 8: snake_case para funciones/variables, PascalCase para clases, líneas ≤79-99 "
            "caracteres, imports ordenados (estándar, terceros, locales)."
        ),
    },
    {
        "id": "kipu-solid-patrones",
        "title": "SOLID y patrones de diseño GoF esenciales",
        "source": "Robert C. Martin — principios SOLID; Gamma, Helm, Johnson, Vlissides (GoF), 'Design Patterns: Elements of Reusable Object-Oriented Software' (1994)",
        "agents": ["kipu"],
        "keywords": ["solid", "patrones", "design patterns", "singleton", "factory", "observer", "strategy", "adapter", "decorator", "gof", "arquitectura", "oop", "poo"],
        "body": (
            "SOLID:\n"
            "S — Responsabilidad Única: una clase debe tener una sola razón para cambiar. "
            "O — Abierto/Cerrado: abierto a extensión, cerrado a modificación (extender con nuevas clases, no editando "
            "las existentes). "
            "L — Sustitución de Liskov: cualquier subclase debe poder usarse donde se espera la clase base sin romper el "
            "programa. "
            "I — Segregación de Interfaces: mejor varias interfaces pequeñas y específicas que una 'gorda' que obligue a "
            "implementar métodos innecesarios. "
            "D — Inversión de Dependencias: depender de abstracciones, no de implementaciones concretas (inyección de "
            "dependencias).\n"
            "Patrones GoF más usados:\n"
            "CREACIONALES — Singleton: una única instancia global (usar con moderación; dificulta los tests). Factory "
            "Method / Abstract Factory: delegar la creación de objetos para desacoplar del tipo concreto. Builder: "
            "construir objetos complejos paso a paso.\n"
            "ESTRUCTURALES — Adapter: envolver una interfaz incompatible para que encaje con la esperada. Decorator: "
            "añadir responsabilidades a un objeto dinámicamente sin herencia. Facade: fachada simple sobre un subsistema "
            "complejo.\n"
            "DE COMPORTAMIENTO — Observer: suscriptores notificados ante eventos (base de sistemas reactivos y UI). "
            "Strategy: intercambiar algoritmos en tiempo de ejecución tras una interfaz común. Command: encapsular una "
            "acción como objeto (deshacer/rehacer, colas).\n"
            "Consejo: los patrones resuelven problemas recurrentes, no se aplican por moda — primero el problema, luego "
            "el patrón."
        ),
    },
    {
        "id": "kipu-estructuras-algoritmos",
        "title": "Estructuras de datos y algoritmos fundamentales",
        "source": "Cormen, Leiserson, Rivest, Stein — 'Introduction to Algorithms' (CLRS, MIT Press); análisis asintótico estándar",
        "agents": ["kipu"],
        "keywords": ["algoritmos", "estructuras de datos", "complejidad", "big o", "hash", "arbol", "grafo", "ordenamiento", "busqueda binaria", "lista enlazada", "pila", "cola", "quicksort", "dijkstra"],
        "body": (
            "Estructuras fundamentales y sus costos típicos (notación Big-O):\n"
            "ARRAY/LISTA: acceso por índice O(1); inserción/borrado en medio O(n). LISTA ENLAZADA: inserción/borrado O(1) "
            "con referencia al nodo; acceso O(n). PILA (LIFO) y COLA (FIFO): push/pop y enqueue/dequeue O(1). "
            "TABLA HASH (dict/map): inserción, búsqueda y borrado O(1) promedio, O(n) en el peor caso por colisiones. "
            "ÁRBOL BINARIO DE BÚSQUEDA balanceado (AVL, rojo-negro): búsqueda/inserción/borrado O(log n). HEAP (cola de "
            "prioridad): mínimo/máximo en O(1), inserción y extracción O(log n). GRAFO: representación por lista de "
            "adyacencia (eficiente para grafos dispersos) o matriz de adyacencia.\n"
            "Algoritmos esenciales:\n"
            "BÚSQUEDA BINARIA sobre datos ordenados: O(log n). ORDENAMIENTO — Quicksort: O(n log n) promedio, O(n²) peor "
            "caso; Mergesort: O(n log n) garantizado y estable, usa O(n) extra; Heapsort: O(n log n) in-place. "
            "RECORRIDOS DE GRAFOS — BFS (anchura, con cola): camino más corto en grafos sin pesos; DFS (profundidad, con "
            "pila/recursión): detección de ciclos, orden topológico. DIJKSTRA con heap: caminos mínimos con pesos no "
            "negativos, O((V+E) log V). PROGRAMACIÓN DINÁMICA: dividir en subproblemas superpuestos y memorizar "
            "resultados (Fibonacci, mochila/knapsack, distancia de edición).\n"
            "Regla práctica: primero elegir la estructura de datos correcta; el algoritmo suele seguir de forma natural."
        ),
    },
    # ── Extra: vademécum / judicial / emergencia (contexto PDF-like) ──
    {
        "id": "minsa-vademecum-basico",
        "title": "Uso racional de medicamentos frecuentes (vademécum básico)",
        "source": "Formulario Nacional de Medicamentos Esenciales DIGEMID/MINSA + buenas prácticas clínicas",
        "agents": ["aya", "sumaq"],
        "keywords": ["paracetamol", "amoxicilina", "ibuprofeno", "omeprazol", "metformina", "losartan", "dosis", "sobredosis", "medicamento", "pastilla", "receta"],
        "body": (
            "PARACETAMOL: adultos 500 mg–1 g cada 6–8 h, máximo 4 g/día. Hepatotóxico en sobredosis; no combinar "
            "con otras presentaciones que lo contengan. En dengue probable es el antipirético de elección.\n"
            "AMOXICILINA: antibiótico beta-lactámico; dosis típica adultos 500 mg cada 8 h (según indicación). "
            "Contraindicado si alergia a penicilinas. Completar el esquema; no automedicarse.\n"
            "IBUPROFENO: AINE; evitar en dengue, úlcera activa, IRC severa o 3er trimestre de gestación.\n"
            "OMEPRAZOL: IBP; usualmente 20 mg/día en ayunas por ciclos cortos salvo indicación.\n"
            "METFORMINA / LOSARTÁN: uso crónico bajo control médico; no suspender abruptamente sin indicación.\n"
            "REGLA MARU: si la dosis parece excesiva (≥4 comprimidos/toma o ≥2 g de principio activo dudoso), "
            "exigir foto de receta y recomendar consulta profesional. Nunca inventar dosis."
        ),
    },
    {
        "id": "legal-proceso-civil-basico",
        "title": "Proceso civil peruano: plazos y principios básicos",
        "source": "Código Procesal Civil (D. Leg. N° 768 y modificatorias) — resumen orientativo",
        "agents": ["inti"],
        "keywords": ["demanda", "plazo", "notificacion", "apelacion", "juicio", "proceso civil", "abogado", "juzgado", "prueba", "sentencia"],
        "body": (
            "El proceso civil peruano se rige por principios de igualdad, contradicción, economía procesal y "
            "motivación de resoluciones. La demanda debe identificar partes, petitorio, fundamentos de hecho y "
            "de derecho, y medios probatorios.\n"
            "Tras la calificación, se admite y se notifica al demandado para contestar dentro del plazo legal "
            "(ordinario suele ser 10 días hábiles salvo reglas especiales). Existen excepciones, reconvención y "
            "saneamiento. La apelación de sentencias se interpone ante el mismo juzgado para elevar a la Sala.\n"
            "IMPORTANTE: este resumen NO sustituye asesoría legal personalizada ni plazos específicos de cada "
            "especialidad (familia, laboral, constitucional). Para un caso concreto, citar norma y recomendar "
            "revisar el expediente y un abogado colegiado."
        ),
    },
    {
        "id": "indeci-kit-emergencia",
        "title": "Kit de emergencia familiar y evacuación (INDECI)",
        "source": "INDECI — Preparación ante desastres / Guía familiar de emergencia",
        "agents": ["tupac", "pacha", "yaku"],
        "keywords": ["kit", "emergencia", "mochila", "evacuacion", "huaico", "sismo", "linterna", "agua", "documentos", "punto de reunion"],
        "body": (
            "Kit mínimo recomendado: agua (3 L/persona/día, ideal 3 días), alimentos no perecederos, linterna + "
            "pilas, radio a pilas, botiquín, medicamentos personales, silbato, cargador/powerbank, documentos en "
            "bolsa impermeable, efectivo, tapa bocas, ropa abrigadora.\n"
            "Antes: identificar zona segura, rutas de evacuación y punto de reunión familiar. Durante sismo: "
            "agacharse, cubrirse y sujetarse. Durante huaico: subir a zona alta, no cruzar corrientes.\n"
            "Después: verificar fugas de gas/agua, no usar ascensores, seguir canales oficiales INDECI/COEN."
        ),
    },
    {
        "id": "senamhi-precipitacion-lectura",
        "title": "Cómo leer precipitación y alerta hidrológica",
        "source": "SENAMHI — Avisos meteorológicos / umbrales orientativos de lluvia",
        "agents": ["pacha", "tupac", "yaku"],
        "keywords": ["precipitacion", "lluvia", "mm", "alerta", "hidrologico", "quebrada", "rimac", "senamhi", "mapa", "calor"],
        "body": (
            "La precipitación se mide en milímetros (mm): 1 mm ≈ 1 L/m². Lluvia ligera <2.5 mm/h; moderada "
            "2.5–10 mm/h; intensa >10 mm/h. En quebradas (p. ej. valle del Rímac / Chosica) lluvias concentradas "
            "en cabecera elevan riesgo de huaico aunque en la ciudad ‘apenas llueva’.\n"
            "Al interpretar un mapa: color frío/teal = acumulación de agua; zonas cálidas/naranja = estrés térmico "
            "o mayor energía del sistema. Combinar con humedad del suelo y avisos hidrológicos oficiales.\n"
            "Acción ciudadana: despejar desagües, evitar cauces, seguir avisos SENAMHI/COEN y rutas de evacuación."
        ),
    },
    # ── Inti · Judicial / trámites (resúmenes MARU, no citas inventadas) ──
    {
        "id": "legal-cpc-demanda-requisitos",
        "title": "CPC: requisitos de la demanda y calificación",
        "source": "Resumen MARU basado en Código Procesal Civil (D. Leg. N° 768 y modificatorias) — orientación general",
        "agents": ["inti"],
        "keywords": ["demanda", "petitorio", "fundamentos", "medios probatorios", "calificacion", "inadmisible", "improcedente", "cpc"],
        "body": (
            "En el proceso civil ordinario, la demanda suele identificar: juez competente, datos de las partes, "
            "petitorio claro, fundamentos de hecho y de derecho, y ofrecimiento de medios probatorios. "
            "El juez califica: puede declarar inadmisible (subsanable, p. ej. falta de anexo) o improcedente "
            "(vía o pretensión no procede). Tras la admisión se notifica al demandado.\n"
            "MARU no calcula plazos caso a caso: remite a revisar el CPC vigente, el expediente y un abogado "
            "colegiado. Este texto es un resumen orientativo, no asesoría legal vinculante."
        ),
    },
    {
        "id": "legal-constitucion-derechos-basicos",
        "title": "Constitución: dignidad, salud y derechos fundamentales (básico)",
        "source": "Resumen MARU basado en Constitución Política del Perú (1993) — Arts. 1, 2, 7 y afines",
        "agents": ["inti", "yaku", "aya"],
        "keywords": ["constitucion", "dignidad", "derechos", "salud", "igualdad", "debido proceso", "libertad"],
        "body": (
            "La Constitución reconoce la dignidad de la persona y un catálogo de derechos fundamentales "
            "(libertad, igualdad ante la ley, integridad, intimidad, debido proceso, entre otros). "
            "El derecho a la salud y a la protección social aparece en el marco de políticas públicas; "
            "no sustituye normas sectoriales (Ley General de Salud, ESSALUD, SIS).\n"
            "Ante conflictos concretos (amparo, hábeas data, etc.) el cauce es el proceso constitucional "
            "ante el Poder Judicial / Tribunal Constitucional. Resumen MARU: no inventar artículos ni números "
            "si no están en este corpus; citar la Constitución y recomendar texto oficial."
        ),
    },
    {
        "id": "legal-tramites-comunes-peru",
        "title": "Trámites comunes en Perú: DNI, SUNARP, municipalidad (orientación)",
        "source": "Resumen MARU basado en prácticas administrativas públicas peruanas (RENIEC, SUNARP, municipalidades) — no es texto oficial literal",
        "agents": ["inti", "yaku"],
        "keywords": ["tramite", "dni", "reniec", "sunarp", "partida", "licencia", "municipalidad", "poder", "notaria"],
        "body": (
            "Trámites frecuentes orientativos:\n"
            "- DNI / identidad: RENIEC (renovación, duplicado, cambio de domicilio).\n"
            "- Propiedad / inmuebles: SUNARP (partida registral, gravámenes); compraventa suele requerir "
            "escritura pública y formalidades notariales.\n"
            "- Local / comercio: licencias municipales, defensa civil, según distrito.\n"
            "- Poderes y actas: notaría + eventual inscripción.\n"
            "Costos, plazos y requisitos cambian por sede y norma vigente. MARU debe indicar canales oficiales "
            "(web RENIEC/SUNARP/municipio) y no inventar tasas ni fechas de vencimiento."
        ),
    },
    {
        "id": "legal-familia-alimentos-orientacion",
        "title": "Familia: alimentos y tenencia (orientación general)",
        "source": "Resumen MARU basado en Código Civil / Código de los Niños y Adolescentes — orientación, no asesoría",
        "agents": ["inti"],
        "keywords": ["alimentos", "pension", "tenencia", "familia", "menor", "divorcio", "violencia"],
        "body": (
            "En materia de alimentos, el interés superior del niño/adolescente prima. Existen procesos "
            "de alimentos ante juzgados de paz letrado / familia según cuantía y reglas vigentes. "
            "La tenencia y régimen de visitas se resuelven priorizando el bienestar del menor.\n"
            "Violencia familiar: canales de denuncia y medidas de protección (Centros Emergencia Mujer, "
            "Policía, fiscalía). MARU no sustituye denuncia ni cálculo de pensión; orienta a acudir a "
            "defensoría / abogado / instituciones oficiales."
        ),
    },
    # ── Aya · Vademécum ampliado (temas del catálogo ~200 meds) ──
    {
        "id": "minsa-vademecum-cardio-meta",
        "title": "Vademécum: cardiovascular y metabólico (resumen seguro)",
        "source": "Resumen MARU alineado a Formulario Nacional / buenas prácticas DIGEMID-MINSA — no sustituye ficha técnica",
        "agents": ["aya", "sumaq"],
        "keywords": ["losartan", "enalapril", "amlodipino", "metformina", "atorvastatina", "furosemida", "insulina", "hipertension", "diabetes"],
        "body": (
            "Antihipertensivos frecuentes (losartán, enalapril, amlodipino): uso crónico bajo control; "
            "no suspender de golpe sin indicación. IECA puede causar tos seca.\n"
            "Metformina: con alimentos; control renal. Insulina: riesgo de hipoglucemia; técnica correcta.\n"
            "Estatinas (atorvastatina): preferible noche; reportar mialgias intensas.\n"
            "Diuréticos: control de electrolitos. REGLA MARU: dosis dudosas → pedir receta; nunca inventar "
            "esquemas. En dengue u otras alertas, revisar interacciones y contraindicaciones del caso."
        ),
    },
    {
        "id": "minsa-vademecum-antiinfecciosos",
        "title": "Vademécum: antiinfecciosos y uso racional",
        "source": "Resumen MARU basado en uso racional de antimicrobianos / Formulario Nacional DIGEMID",
        "agents": ["aya"],
        "keywords": ["amoxicilina", "azitromicina", "ciprofloxacino", "metronidazol", "antibiotico", "resistencia", "penicilina"],
        "body": (
            "Antibióticos (amoxicilina, azitromicina, cefalexina, ciprofloxacino, etc.): solo con indicación; "
            "completar esquema; no automedicarse. Alergia a penicilina contraindica beta-lactámicos relacionados.\n"
            "Metronidazol: evitar alcohol. Fluoroquinolonas: riesgo tendinoso; no con lácteos/antiácidos que "
            "interfieran absorción.\n"
            "Antivirales/antiparasitarios (aciclovir, ivermectina, albendazol): según peso/esquema médico.\n"
            "MARU enfatiza resistencia antimicrobiana: no ‘dar antibiótico por si acaso’."
        ),
    },
    {
        "id": "minsa-vademecum-analgesia-gi",
        "title": "Vademécum: analgesia, AINE e IBP",
        "source": "Resumen MARU basado en buenas prácticas clínicas y Formulario Nacional",
        "agents": ["aya", "sumaq"],
        "keywords": ["paracetamol", "ibuprofeno", "diclofenaco", "omeprazol", "pantoprazol", "aine", "gastritis", "dolor"],
        "body": (
            "Paracetamol: antipirético de elección en muchos contextos; máx. orientativo 4 g/día adulto; "
            "hepatotoxicidad en sobredosis.\n"
            "AINE (ibuprofeno, diclofenaco): evitar en dengue probable, úlcera activa, IRC severa, 3er trimestre.\n"
            "IBP (omeprazol, pantoprazol): en ayunas; ciclos cortos salvo indicación.\n"
            "Opioides débiles (tramadol): sedación/náuseas; solo con indicación. Ante exceso aparente de "
            "comprimidos por toma, MARU pide foto de receta y deriva a profesional."
        ),
    },
    {
        "id": "minsa-vademecum-salud-mental",
        "title": "Vademécum: salud mental (ISRS, benzodiacepinas) — precauciones",
        "source": "Resumen MARU de precauciones clínicas habituales — no es guía de prescripción",
        "agents": ["aya", "sumaq"],
        "keywords": ["sertralina", "fluoxetina", "alprazolam", "clonazepam", "ansiedad", "depresion", "benzodiacepina"],
        "body": (
            "ISRS (sertralina, fluoxetina): efecto gradual; no suspender abruptamente sin indicación; "
            "vigilar interacciones.\n"
            "Benzodiacepinas (alprazolam, clonazepam, diazepam): sedación, dependencia; uso corto; no alcohol.\n"
            "Antipsicóticos/antiepilépticos: control médico estricto (metabólico, niveles, teratogenicidad "
            "según fármaco).\n"
            "MARU no inicia ni titula psicofármacos: escucha, orienta a emergencia si hay riesgo, y remite "
            "a salud mental / médico tratante."
        ),
    },
    # ── Tupac · Emergencia ampliada ──
    {
        "id": "indeci-sismo-familia",
        "title": "Sismos: antes, durante y después (familia)",
        "source": "Resumen MARU basado en recomendaciones INDECI / IGP de preparación sísmica",
        "agents": ["tupac", "pacha", "yaku"],
        "keywords": ["sismo", "terremoto", "evacuacion", "punto de reunion", "mochila", "gas", "igp", "indeci"],
        "body": (
            "Antes: identificar zonas seguras, fijar estanterías, tener kit y punto de reunión, conocer rutas.\n"
            "Durante: agacharse, cubrirse y sujetarse; lejos de ventanas; no usar ascensores.\n"
            "Después: verificar fugas de gas/agua/electricidad; no encender fuego si hay olor a gas; "
            "seguir canales oficiales INDECI/COEN 115 e IGP. Teléfonos útiles: Bomberos 116, SAMU 106, "
            "Policía 105. Resumen orientativo; priorizar autoridades locales en alerta real."
        ),
    },
    {
        "id": "emg-primeros-auxilios-basico",
        "title": "Primeros auxilios básicos (hemorragia, quemadura, desmayo)",
        "source": "Resumen MARU basado en principios de primeros auxilios AHA/Cruz Roja adoptados en capacitación ciudadana",
        "agents": ["tupac", "aya"],
        "keywords": ["hemorragia", "quemadura", "desmayo", "botiquin", "vendaje", "samu", "auxilios"],
        "body": (
            "Hemorragia externa: presión directa con gasa limpia; elevar si es posible; no retirar apósitos "
            "empapados — añadir encima. Quemaduras: agua tibia corriente; no remedios caseros grasos; "
            "cubrir con apósitos limpios. Desmayo: tumbar, elevar piernas si no hay trauma; valorar vía "
            "aérea y respiración.\n"
            "Activar SAMU 106 ante compromiso vital. Este resumen no reemplaza curso formal de primeros auxilios."
        ),
    },
    {
        "id": "indeci-huaico-quebradas",
        "title": "Huaicos en quebradas: alerta temprana ciudadana",
        "source": "Resumen MARU basado en INDECI / COEN y experiencia de cuencas (p. ej. Rímac)",
        "agents": ["tupac", "pacha"],
        "keywords": ["huaico", "lloclla", "quebrada", "evacuacion", "zona alta", "chosica", "rimac", "coen"],
        "body": (
            "Lluvias intensas en cabecera + suelos saturados elevan riesgo de huaico aunque en el valle "
            "‘casi no llueva’. Señales: turbidez súbita, ruido de arrastre, avisos SENAMHI/COEN.\n"
            "Acción: subir a zona segura predefinida; no cruzar cauces; no regresar por pertenencias. "
            "Mantener kit, documentos y punto de reunión familiar. Números: INDECI/COEN 115, Bomberos 116."
        ),
    },
    # ── Pacha · Clima / SENAMHI ──
    {
        "id": "senamhi-avisos-colores",
        "title": "Avisos SENAMHI: lectura orientativa de niveles",
        "source": "Resumen MARU basado en lógica de avisos meteorológicos SENAMHI (consultar boletín oficial vigente)",
        "agents": ["pacha", "tupac"],
        "keywords": ["aviso", "senamhi", "naranja", "rojo", "amarillo", "lluvia", "viento", "temperatura"],
        "body": (
            "Los avisos meteorológicos suelen escalar por impacto potencial (amarillo → naranja → rojo). "
            "MARU debe remitir al boletín/aviso oficial del día y no inventar umbrales de color si no "
            "están publicados.\n"
            "Combinar precipitación, viento, temperatura extrema y avisos hidrológicos. En costa central "
            "y sierra, el mismo mm de lluvia no implica el mismo riesgo: importa la cuenca y la humedad "
            "previa del suelo."
        ),
    },
    {
        "id": "clima-nino-costero-ciudadano",
        "title": "Niño costero / ENFEN: qué vigilar como ciudadano",
        "source": "Resumen MARU basado en comunicados ENFEN (IMARPE, SENAMHI, IGP, et al.)",
        "agents": ["pacha", "yaku", "tupac"],
        "keywords": ["nino", "enfen", "tssm", "lluvia", "norte", "temperatura mar"],
        "body": (
            "El fenómeno El Niño / Niño costero se monitorea por anomalías de temperatura superficial "
            "del mar y patrones de lluvia. Comunicados ENFEN informan estados de vigilancia/alerta.\n"
            "Impacto ciudadano típico: lluvias intensas en norte y centro, riesgo de inundaciones/huaicos, "
            "estrés en salud (dengue) e infraestructura. Acción: seguir comunicados oficiales, limpiar "
            "desagües, revisar plan familiar. No inventar magnitudes de TSM ni fechas de ‘pico’."
        ),
    },
    # ── Yaku · Cultura / historia / geografía Perú ──
    {
        "id": "yaku-geografia-regiones",
        "title": "Geografía del Perú: costa, sierra y selva",
        "source": "Resumen MARU de geografía escolar/cultural peruana (INEI / textos educativos de referencia)",
        "agents": ["yaku", "pacha"],
        "keywords": ["costa", "sierra", "selva", "andes", "amazonia", "pacifico", "regiones", "geografia"],
        "body": (
            "El Perú se organiza tradicionalmente en costa (desierto costero y llanuras), sierra (Andes, "
            "altiplanos, valles interandinos) y selva (alta y baja Amazonía). La diversidad de climas "
            "explica cultivos, riesgos (sismos en costa/sierra; lluvias/huaicos; inundaciones amazónicas) "
            "y diversidad cultural.\n"
            "Ciudades de referencia: Lima-Callao (costa central), Arequipa/Cusco/Puno (sierra), "
            "Iquitos/Pucallpa (selva). Resumen cultural-educativo; para datos demográficos citar INEI."
        ),
    },
    {
        "id": "yaku-historia-breve",
        "title": "Historia breve del Perú: hitos para conversación",
        "source": "Resumen MARU de hitos históricos de dominio público (periodización escolar)",
        "agents": ["yaku"],
        "keywords": ["inca", "virreinato", "independencia", "republica", "tahuantinsuyo", "historia", "cusco"],
        "body": (
            "Hitos orientativos: culturas prehispánicas; Tahuantinsuyo (Cusco); conquista y Virreinato "
            "del Perú; independencia (siglo XIX); vida republicana con ciclos políticos y sociales. "
            "El Quechua y el Aymara, junto al castellano, forman parte del patrimonio lingüístico.\n"
            "MARU usa este marco para conversación cultural; no inventa fechas dudosas ni citas de "
            "crónicas no listadas aquí."
        ),
    },
    {
        "id": "yaku-cultura-quechua-basico",
        "title": "Cultura andina y quechua: nociones básicas",
        "source": "Resumen MARU de nociones culturales abiertas (lengua, ayni, pachamama) — no es glosario oficial MINEDU",
        "agents": ["yaku", "sumaq"],
        "keywords": ["quechua", "ayni", "pachamama", "runasimi", "andino", "comunidad", "traduccion"],
        "body": (
            "El runasimi (quechua) agrupa variedades; saludos y fórmulas de respeto varían por región. "
            "Conceptos frecuentes en diálogo intercultural: ayni (reciprocidad), pachamama (tierra/mundo), "
            "ayllu (comunidad). MARU puede ayudar a traducir frases simples y explicar contexto, "
            "señalando límites (no sustituye hablante nativo ni intérprete oficial)."
        ),
    },
    # ── Kipu · tooling IA local / programación ──
    {
        "id": "kipu-ollama-local",
        "title": "Ollama y modelos locales en MARU",
        "source": "Resumen MARU basado en documentación pública de Ollama + arquitectura MARU OS",
        "agents": ["kipu"],
        "keywords": ["ollama", "modelo", "gguf", "local", "ram", "gemma", "llama", "api"],
        "body": (
            "MARU puede enrutar chat a modelos locales vía Ollama (API HTTP). Formato habitual de pesos: "
            "GGUF/quantizations. La RAM disponible limita el tamaño del modelo.\n"
            "Buenas prácticas: verificar `ollama list`, probar un modelo pequeño primero, no exponer "
            "la API a redes no confiables. Si el modelo falla por VRAM/RAM, sugerir uno más liviano "
            "o modo cloud solo si el usuario lo habilita."
        ),
    },
    {
        "id": "kipu-rag-offline",
        "title": "RAG offline: bóveda + base de conocimiento",
        "source": "Resumen MARU de la arquitectura interna (knowledge_base + document_vault)",
        "agents": ["kipu", "inti"],
        "keywords": ["rag", "embeddings", "qdrant", "vault", "offline", "chunks", "busqueda"],
        "body": (
            "MARU combina: (1) base de conocimiento embebida offline con scoring léxico; "
            "(2) bóveda documental del usuario (PDF/texto) con chunks; (3) opcionalmente Qdrant "
            "cuando el stack Docker está arriba.\n"
            "Para desarrollo: preferir textos fieles y fuentes etiquetadas; no inventar citas. "
            "Si la API `/knowledge` está reachable, el frontend puede refrescar el índice."
        ),
    },
]

# ══════════════════════════════════════════════════════════════════
#  Recuperación léxica offline
# ══════════════════════════════════════════════════════════════════

_STOPWORDS = {
    "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al", "a", "en", "y", "o", "u",
    "que", "como", "por", "para", "con", "sin", "se", "su", "sus", "es", "son", "esta", "este", "esto",
    "hay", "me", "mi", "te", "tu", "le", "lo", "si", "no", "ya", "muy", "mas", "pero", "tengo", "tiene",
    "puedo", "puede", "debo", "debe", "hacer", "hago", "sobre", "cual", "cuales", "donde", "cuando",
    "quien", "porque", "the", "of", "and", "or", "to", "in", "is", "it", "qué", "cómo", "dónde",
}


def _normalize(text: str) -> str:
    """Minúsculas y sin acentos/diacríticos (ñ se conserva como n — suficiente para matching)."""
    text = text.lower()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return text


def _tokenize(text: str) -> List[str]:
    tokens = re.findall(r"[a-z0-9]+", _normalize(text))
    return [t for t in tokens if len(t) > 2 and t not in _STOPWORDS]


def list_documents(agent: Optional[str] = None, query: Optional[str] = None) -> List[Dict[str, Any]]:
    """Lista/filtra documentos. Con `query` devuelve ordenados por relevancia."""
    docs = get_active_knowledge_base()
    if agent:
        agent = agent.strip().lower()
        docs = [d for d in docs if agent in d["agents"]]
    if query and query.strip():
        scored = [(score_document(d, query), d) for d in docs]
        scored = [(s, d) for s, d in scored if s > 0]
        scored.sort(key=lambda x: x[0], reverse=True)
        return [d for _, d in scored]
    return list(docs)


def score_document(doc: Dict[str, Any], query: str) -> float:
    """Scoring léxico: keywords pesan 4, título 2, cuerpo 1 (por token de la consulta)."""
    q_tokens = set(_tokenize(query))
    if not q_tokens:
        return 0.0

    kw_tokens = set()
    for kw in doc["keywords"]:
        kw_tokens.update(_tokenize(kw))
        kw_tokens.add(_normalize(kw).strip())
    title_tokens = set(_tokenize(doc["title"]))
    body_tokens = set(_tokenize(doc["body"]))

    score = 0.0
    q_norm = _normalize(query)
    for token in q_tokens:
        if token in kw_tokens:
            score += 4.0
        if token in title_tokens:
            score += 2.0
        if token in body_tokens:
            score += 1.0
    # Bonus por keyword multi-palabra presente como frase en la consulta
    for kw in doc["keywords"]:
        kw_norm = _normalize(kw)
        if " " in kw_norm and kw_norm in q_norm:
            score += 6.0
    return score


def search_knowledge(
    query: str,
    agent_id: Optional[str] = None,
    limit: int = 3,
    min_score: float = 4.0,
) -> List[Dict[str, Any]]:
    """
    Recupera los documentos oficiales más relevantes para la consulta,
    filtrados por agente propietario. 100% offline (léxico, sin embeddings).
    """
    candidates = get_active_knowledge_base()
    if agent_id:
        agent_id = agent_id.strip().lower()
        owned = [d for d in candidates if agent_id in d["agents"]]
        # Si el agente no posee documentos, no inyectamos nada (evita ruido).
        candidates = owned

    scored = [(score_document(d, query), d) for d in candidates]
    scored = [(s, d) for s, d in scored if s >= min_score]
    scored.sort(key=lambda x: x[0], reverse=True)
    return [d for _, d in scored[:limit]]


def build_rag_context(query: str, agent_id: Optional[str] = None, limit: int = 3) -> str:
    """
    Construye el bloque de contexto RAG con fuentes oficiales, listo para
    inyectarse en el system prompt. Devuelve cadena vacía si no hay match.
    """
    docs = search_knowledge(query, agent_id=agent_id, limit=limit)
    if not docs:
        return ""

    parts = [
        "\n[BASE DE CONOCIMIENTO OFICIAL — Fuentes verificables]",
        "Usa la siguiente información oficial como base de tu respuesta y cita la fuente/norma cuando corresponda:",
    ]
    for doc in docs:
        parts.append(f"\n### {doc['title']}\nFuente oficial: {doc['source']}\n{doc['body']}")
    parts.append(
        "\nFIN DE FUENTES OFICIALES. No inventes normas ni citas que no estén aquí; "
        "si algo no está cubierto, dilo honestamente y recomienda consultar la fuente oficial."
    )
    return "\n".join(parts)


def export_catalog_index() -> List[Dict[str, Any]]:
    """Índice ligero (id, title, source, agents, keywords, summary) para frontend / public/kb."""
    out: List[Dict[str, Any]] = []
    for d in get_active_knowledge_base():
        body = d.get("body") or ""
        summary = body.split("\n", 1)[0][:160]
        out.append(
            {
                "id": d["id"],
                "title": d["title"],
                "source": d["source"],
                "agents": list(d["agents"]),
                "keywords": list(d["keywords"]),
                "summary": summary,
            }
        )
    return out


def export_full_knowledge() -> Dict[str, Any]:
    """Export completo para sync remoto / espejo entre instancias MARU."""
    docs = get_active_knowledge_base()
    return {
        "version": 1,
        "exportedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "count": len(docs),
        "documents": [
            {
                "id": d["id"],
                "title": d["title"],
                "source": d["source"],
                "agents": list(d["agents"]),
                "keywords": list(d["keywords"]),
                "body": d["body"],
            }
            for d in docs
        ],
    }


def _remote_override_path() -> Path:
    return Path(__file__).resolve().parent.parent / "data" / "kb" / "remote_override.json"


def _load_remote_docs() -> List[Dict[str, Any]]:
    path = _remote_override_path()
    if not path.exists():
        return []
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        docs = payload.get("documents") or []
        return [d for d in docs if isinstance(d, dict) and d.get("id") and d.get("body")]
    except Exception:
        return []


def get_active_knowledge_base() -> List[Dict[str, Any]]:
    """Corpus embebido + overrides remotos (merge por id; remoto gana)."""
    by_id: Dict[str, Dict[str, Any]] = {d["id"]: d for d in KNOWLEDGE_BASE}
    for d in _load_remote_docs():
        by_id[d["id"]] = d
    return list(by_id.values())


def _validate_remote_doc(d: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    required = ("id", "title", "source", "agents", "keywords", "body")
    if not all(k in d for k in required):
        return None
    if not isinstance(d["agents"], list) or not isinstance(d["keywords"], list):
        return None
    if not str(d["body"]).strip():
        return None
    return {
        "id": str(d["id"]),
        "title": str(d["title"]),
        "source": str(d["source"]),
        "agents": [str(a) for a in d["agents"]],
        "keywords": [str(k) for k in d["keywords"]],
        "body": str(d["body"]),
    }


def try_refresh_from_remote(api_base: Optional[str] = None) -> Dict[str, Any]:
    """
    Refresco online de la KB.

    Prioridad de URL:
      1. api_base (argumento)
      2. MARU_KB_REMOTE_URL
      3. Si no hay remoto: sincroniza desde el propio export local (no-op útil para healthcheck)

    Espera JSON con shape { documents: [ {id,title,source,agents,keywords,body}, ... ] }
    o una lista directa de documentos.
    """
    import os
    import urllib.error
    import urllib.request

    remote = (api_base or os.getenv("MARU_KB_REMOTE_URL") or "").strip().rstrip("/")
    if not remote:
        return {
            "status": "skipped",
            "reason": "Defina MARU_KB_REMOTE_URL (o pase api_base) apuntando a /knowledge/export",
            "documentCount": len(get_active_knowledge_base()),
            "embeddedCount": len(KNOWLEDGE_BASE),
            "remoteMerged": len(_load_remote_docs()),
        }

    url = remote if remote.endswith("/export") or remote.endswith(".json") else f"{remote}/knowledge/export"
    if not url.startswith("http"):
        return {"status": "skipped", "reason": f"URL inválida: {url}"}

    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "MARU-OS-KB/1.0"})
        with urllib.request.urlopen(req, timeout=12) as resp:
            raw = resp.read().decode("utf-8")
        payload = json.loads(raw)
    except urllib.error.URLError as e:
        return {"status": "offline", "reason": str(e), "documentCount": len(get_active_knowledge_base())}
    except Exception as e:
        return {"status": "error", "reason": str(e), "documentCount": len(get_active_knowledge_base())}

    docs_in = payload.get("documents") if isinstance(payload, dict) else payload
    if not isinstance(docs_in, list):
        return {"status": "error", "reason": "JSON remoto sin lista documents", "documentCount": len(get_active_knowledge_base())}

    validated: List[Dict[str, Any]] = []
    for item in docs_in:
        if isinstance(item, dict):
            v = _validate_remote_doc(item)
            if v:
                validated.append(v)

    if not validated:
        return {"status": "error", "reason": "Ningún documento remoto pasó validación", "documentCount": len(get_active_knowledge_base())}

    out_path = _remote_override_path()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(
            {
                "mergedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
                "sourceUrl": url,
                "count": len(validated),
                "documents": validated,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    return {
        "status": "ok",
        "sourceUrl": url,
        "merged": len(validated),
        "documentCount": len(get_active_knowledge_base()),
        "embeddedCount": len(KNOWLEDGE_BASE),
        "remoteMerged": len(validated),
    }

