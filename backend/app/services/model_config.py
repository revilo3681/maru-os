"""
MARU OS — Motor de modelos configurable.

- Catálogo de modelos locales seleccionables (nombres canónicos '-mlx' + alias
  reales instalados en Ollama, p. ej. 'gemma4:e2b-q4').
- Resolución de nombres contra los modelos realmente instalados (/api/tags).
- Configuración persistente (JSON) del modo de motor:
    * 'manual' (default): UN modelo fijo para todos los agentes.
    * 'router': comportamiento automático actual (cada agente usa su modelo).
"""

import json
import logging
import os
import threading
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ══════════════════════════════════════════════════════════════════
#  Catálogo de modelos seleccionables
#  'aliases' = nombres equivalentes con los que puede estar instalado en Ollama
# ══════════════════════════════════════════════════════════════════
MODEL_CATALOG: List[Dict[str, Any]] = [
    {
        "id": "gemma4:e2b-q4",
        "label": "Gemma 4 E2B (cuantizado - más rápido)",
        "ram": "3.3 GB",
        "role": "Ultra rápido / Default",
        "is_cloud": False,
        "aliases": ["gemma4:e2b-q4", "gemma4:e2b-mlx", "gemma4:e2b"],
    },
    {
        "id": "gemma4:e4b-q4",
        "label": "Gemma 4 E4B (cuantizado - equilibrado)",
        "ram": "5.2 GB",
        "role": "Cerebro principal",
        "is_cloud": False,
        "aliases": ["gemma4:e4b-q4", "gemma4:e4b-mlx", "gemma4:e4b"],
    },
    {
        "id": "gemma4:12b-q4",
        "label": "Gemma 4 12B (cuantizado - máxima precisión)",
        "ram": "7.0 GB",
        "role": "Visión & Código de alta precisión",
        "is_cloud": False,
        "aliases": ["gemma4:12b-q4", "gemma4:12b-mlx", "gemma4:12b"],
    },
    {
        "id": "gemma4:31b-cloud",
        "label": "Gemma 4 31B (nube)",
        "ram": "Cloud",
        "role": "Razonamiento máximo (requiere internet)",
        "is_cloud": True,
        "aliases": ["gemma4:31b-cloud", "gemma4:cloud"],
    },
]

DEFAULT_MODEL_ID = "gemma4:e2b-q4"  # el más rápido

VALID_ENGINE_MODES = ("manual", "router")

ALL_AGENT_IDS = ["aya", "inti", "kipu", "sumaq", "pacha", "tupac", "yaku"]

DEFAULT_CONFIG: Dict[str, Any] = {
    "engineMode": "manual",
    "manualModel": DEFAULT_MODEL_ID,
    "enabledAgents": list(ALL_AGENT_IDS),
}

_CONFIG_PATH = os.getenv(
    "MARU_CONFIG_PATH",
    os.path.join(os.path.dirname(__file__), "..", "data", "maru_config.json"),
)
_config_lock = threading.Lock()


# ══════════════════════════════════════════════════════════════════
#  Persistencia de configuración (JSON local, sin Postgres)
# ══════════════════════════════════════════════════════════════════

def load_config() -> Dict[str, Any]:
    try:
        with open(_CONFIG_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        merged = {**DEFAULT_CONFIG, **{k: v for k, v in data.items() if k in DEFAULT_CONFIG}}
        if merged["engineMode"] not in VALID_ENGINE_MODES:
            merged["engineMode"] = DEFAULT_CONFIG["engineMode"]
        return merged
    except FileNotFoundError:
        return dict(DEFAULT_CONFIG)
    except Exception as e:
        logger.warning(f"Config corrupta en {_CONFIG_PATH}, usando defaults: {e}")
        return dict(DEFAULT_CONFIG)


def save_config(
    engine_mode: Optional[str] = None,
    manual_model: Optional[str] = None,
    enabled_agents: Optional[List[str]] = None,
) -> Dict[str, Any]:
    with _config_lock:
        config = load_config()
        if engine_mode is not None:
            if engine_mode not in VALID_ENGINE_MODES:
                raise ValueError(f"engineMode inválido: {engine_mode}. Válidos: {VALID_ENGINE_MODES}")
            config["engineMode"] = engine_mode
        if manual_model is not None:
            config["manualModel"] = canonical_model_id(manual_model)
        if enabled_agents is not None:
            config["enabledAgents"] = [a for a in enabled_agents if a in ALL_AGENT_IDS] or list(ALL_AGENT_IDS)

        os.makedirs(os.path.dirname(os.path.abspath(_CONFIG_PATH)), exist_ok=True)
        with open(_CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        return config


# ══════════════════════════════════════════════════════════════════
#  Resolución de nombres de modelos contra Ollama
# ══════════════════════════════════════════════════════════════════

def canonical_model_id(name: str) -> str:
    """Normaliza cualquier alias (p. ej. 'gemma4:e2b-q4') a su id canónico del catálogo."""
    name = (name or "").strip()
    stripped = name[:-len(":latest")] if name.endswith(":latest") else name
    for entry in MODEL_CATALOG:
        if stripped == entry["id"] or stripped in entry["aliases"]:
            return entry["id"]
    return name  # modelo fuera de catálogo: se respeta tal cual


def resolve_model_name(requested: str, installed_names: List[str]) -> str:
    """
    Traduce un nombre solicitado (canónico o alias) al modelo REALMENTE instalado
    en Ollama. Si no hay lista de instalados (Ollama caído), devuelve el primer
    alias '-q4' (naming histórico que ya funciona) o el nombre pedido.
    """
    normalized_installed = set()
    for n in installed_names:
        normalized_installed.add(n)
        if n.endswith(":latest"):
            normalized_installed.add(n[:-len(":latest")])

    requested = (requested or "").strip() or DEFAULT_MODEL_ID
    entry = next(
        (e for e in MODEL_CATALOG if requested == e["id"] or requested in e["aliases"]),
        None,
    )

    if entry is None:
        # Fuera de catálogo: usarlo si está instalado, si no, dejarlo (Ollama decidirá)
        return requested

    if normalized_installed:
        for alias in entry["aliases"]:
            if alias in normalized_installed:
                return alias
        # Modelo ausente: degradar al primer modelo local del catálogo que sí esté
        for other in MODEL_CATALOG:
            if other["is_cloud"]:
                continue
            for alias in other["aliases"]:
                if alias in normalized_installed:
                    logger.warning(f"Modelo '{requested}' no instalado; usando '{alias}'")
                    return alias
        return requested

    # Sin información de instalados: alias '-q4' como default histórico funcional
    q4 = next((a for a in entry["aliases"] if a.endswith("-q4")), None)
    return q4 or entry["aliases"][0]


def catalog_with_availability(installed_names: List[str]) -> List[Dict[str, Any]]:
    """Catálogo enriquecido con disponibilidad real y el nombre instalado resuelto."""
    normalized = set()
    for n in installed_names:
        normalized.add(n)
        if n.endswith(":latest"):
            normalized.add(n[:-len(":latest")])

    result = []
    for entry in MODEL_CATALOG:
        installed_alias = next((a for a in entry["aliases"] if a in normalized), None)
        result.append({
            "id": entry["id"],
            "label": entry["label"],
            "ram": entry["ram"],
            "role": entry["role"],
            "isCloud": entry["is_cloud"],
            "installed": installed_alias is not None or entry["is_cloud"],
            "resolvedName": installed_alias or resolve_model_name(entry["id"], installed_names),
        })
    return result
