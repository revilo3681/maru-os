"""
Tests offline de la Base de Conocimiento Oficial y del motor configurable.
No requieren Ollama, Qdrant ni FastAPI: solo la stdlib.

Ejecutar:  python3 backend/test_knowledge_base.py
"""

import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Config temporal para no ensuciar la config real durante los tests
os.environ["MARU_CONFIG_PATH"] = os.path.join(tempfile.mkdtemp(), "maru_config_test.json")

from app.services.knowledge_base import (  # noqa: E402
    KNOWLEDGE_BASE,
    build_rag_context,
    list_documents,
    search_knowledge,
)
from app.services import model_config  # noqa: E402

PASSED = 0


def check(name: str, condition: bool, detail: str = ""):
    global PASSED
    if not condition:
        print(f"  ✗ FALLÓ: {name} {detail}")
        sys.exit(1)
    PASSED += 1
    print(f"  ✓ {name}")


print("── Base de Conocimiento ──")
check("KB tiene al menos 20 documentos", len(KNOWLEDGE_BASE) >= 20, f"(hay {len(KNOWLEDGE_BASE)})")
check("Todos los docs tienen campos obligatorios",
      all(d.get(k) for d in KNOWLEDGE_BASE for k in ("id", "title", "source", "agents", "keywords", "body")))
ids = [d["id"] for d in KNOWLEDGE_BASE]
check("IDs únicos", len(ids) == len(set(ids)))

print("── Recuperación léxica (dengue) ──")
results = search_knowledge("Tengo fiebre y creo que es dengue, ¿puedo tomar ibuprofeno?", agent_id="aya")
check("La consulta de dengue devuelve resultados", len(results) > 0)
check("El primer resultado es el doc de dengue NTS 125", results[0]["id"] == "minsa-dengue-nts125",
      f"(fue {results[0]['id']})")
check("El doc contiene la regla NO AINEs", "PROHIBIDO" in results[0]["body"] and "ibuprofeno" in results[0]["body"])

ctx = build_rag_context("me pico un zancudo y tengo fiebre, sera dengue?", agent_id="aya")
check("El contexto RAG inyecta la fuente oficial NTS 125", "NTS N° 125" in ctx)
check("El contexto RAG está etiquetado como fuentes oficiales", "BASE DE CONOCIMIENTO OFICIAL" in ctx)

print("── Filtro por agente propietario ──")
kipu_results = search_knowledge("como manejo el dengue con ibuprofeno", agent_id="kipu")
check("Kipu NO recibe docs médicos (no es propietario)",
      all("dengue" not in d["id"] for d in kipu_results))
kipu_ia = search_knowledge("¿qué formato uso, GGUF u ONNX, para correr un modelo en el navegador?", agent_id="kipu")
check("Kipu recupera la guía de formatos de IA", any(d["id"] == "kipu-formatos-ia" for d in kipu_ia))
yaku_const = search_knowledge("¿qué dice la constitución sobre el derecho a la salud?", agent_id="yaku")
check("Yaku recupera la Constitución", any(d["id"] == "legal-constitucion" for d in yaku_const))
tupac_h = search_knowledge("hay alerta de huaico en mi quebrada, ¿qué hago?", agent_id="tupac")
check("Tupac recupera el plan de evacuación INDECI", any(d["id"] == "emg-huaico-indeci" for d in tupac_h))
aya_arana = search_knowledge("me mordió una araña violinista", agent_id="aya")
check("Aya recupera el doc de Loxosceles", any(d["id"] == "emg-loxosceles" for d in aya_arana))

print("── Listado / búsqueda del endpoint ──")
check("list_documents filtra por agente", all("kipu" in d["agents"] for d in list_documents(agent="kipu")))
check("list_documents con query ordena por relevancia",
      list_documents(query="dengue")[0]["id"] == "minsa-dengue-nts125")

print("── Motor configurable ──")
cfg = model_config.load_config()
check("Default es modo MANUAL", cfg["engineMode"] == "manual")
check("Default es el modelo más rápido", cfg["manualModel"] == "gemma4:e2b-mlx")

installed = ["gemma4:12b-q4", "gemma4:e4b-q4", "gemma4:e2b-q4", "gemma4:31b-cloud", "nomic-embed-text:latest"]
check("e2b-mlx se resuelve al e2b-q4 instalado",
      model_config.resolve_model_name("gemma4:e2b-mlx", installed) == "gemma4:e2b-q4")
check("12b-mlx se resuelve al 12b-q4 instalado",
      model_config.resolve_model_name("gemma4:12b-mlx", installed) == "gemma4:12b-q4")
check("Alias q4 se normaliza a id canónico",
      model_config.canonical_model_id("gemma4:e4b-q4") == "gemma4:e4b-mlx")
check("Modelo ausente degrada a un local instalado",
      model_config.resolve_model_name("gemma4:e4b-mlx", ["gemma4:e2b-q4"]) == "gemma4:e2b-q4")
check("Sin lista de instalados usa alias -q4 funcional",
      model_config.resolve_model_name("gemma4:e2b-mlx", []) == "gemma4:e2b-q4")

saved = model_config.save_config(engine_mode="router", manual_model="gemma4:12b-q4")
check("save_config persiste y normaliza el modelo",
      saved["engineMode"] == "router" and saved["manualModel"] == "gemma4:12b-mlx")
check("load_config relee lo persistido", model_config.load_config()["engineMode"] == "router")

catalog = model_config.catalog_with_availability(installed)
check("Catálogo marca disponibilidad real",
      all(e["installed"] for e in catalog if e["id"] != "gemma4:e4b-mlx" or e["installed"]))

print(f"\n✅ {PASSED} verificaciones pasaron correctamente.")
