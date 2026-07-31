"""
MARU OS — Motor de modelos configurable.

Prioridad de resolución (Router y Manual):
  1) Versión cuantizada (p. ej. gemma4:e2b-q4, gemma4:e4b-q4, gemma4:12b-q4)
  2) Si no está, versión normal sin cuantizar (gemma4:e2b, gemma4:e4b, gemma4:12b)
  3) Cloud: preferir gemma4:cloud (menor consumo) sobre gemma4:31b-cloud
"""

from __future__ import annotations

import json
import logging
import os
import threading
from typing import Any, Dict, List, Optional, Sequence

logger = logging.getLogger(__name__)

# ══════════════════════════════════════════════════════════════════
#  Familias de modelos (cuantizado → normal)
# ══════════════════════════════════════════════════════════════════
MODEL_FAMILIES: Dict[str, Dict[str, Any]] = {
    "e2b": {
        "id": "gemma4:e2b-q4",
        "label": "Gemma 4 E2B (cuantizado · más rápido)",
        "ram": "3.3 GB",
        "role": "Ultra rápido / Default / Traductor Yaku",
        "is_cloud": False,
        # Orden estricto: cuantizado primero, luego normal
        "prefer": ["gemma4:e2b-q4", "gemma4:e2b-mlx", "gemma4:e2b"],
    },
    "e4b": {
        "id": "gemma4:e4b-q4",
        "label": "Gemma 4 E4B (cuantizado · equilibrado)",
        "ram": "5.2 GB",
        "role": "Cerebro principal",
        "is_cloud": False,
        "prefer": ["gemma4:e4b-q4", "gemma4:e4b-mlx", "gemma4:e4b"],
    },
    "12b": {
        "id": "gemma4:12b-q4",
        "label": "Gemma 4 12B (cuantizado · máxima precisión)",
        "ram": "7.0 GB",
        "role": "Visión & Código de alta precisión",
        "is_cloud": False,
        "prefer": ["gemma4:12b-q4", "gemma4:12b-mlx", "gemma4:12b"],
    },
    "cloud": {
        # Preferir cloud liviano; 31b-cloud solo si no hay alternativa
        "id": "gemma4:cloud",
        "label": "Gemma 4 Cloud (menor consumo)",
        "ram": "Cloud",
        "role": "Nube · preferir gemma4:cloud sobre 31b",
        "is_cloud": True,
        "prefer": ["gemma4:cloud", "gemma4:31b-cloud"],
    },
}

# Catálogo plano (UI + API) derivado de familias
MODEL_CATALOG: List[Dict[str, Any]] = [
    {
        "id": fam["id"],
        "label": fam["label"],
        "ram": fam["ram"],
        "role": fam["role"],
        "is_cloud": fam["is_cloud"],
        "aliases": list(fam["prefer"]),
        "family": key,
    }
    for key, fam in MODEL_FAMILIES.items()
]

DEFAULT_MODEL_ID = "gemma4:e2b-q4"
CLOUD_PREFERRED = "gemma4:cloud"
CLOUD_FALLBACK = "gemma4:31b-cloud"

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


def _normalize_name(name: str) -> str:
    name = (name or "").strip()
    if name.endswith(":latest"):
        name = name[: -len(":latest")]
    return name


def _installed_set(installed_names: Sequence[str]) -> set:
    out = set()
    for n in installed_names:
        n = _normalize_name(n)
        if n:
            out.add(n)
    return out


def _family_for(name: str) -> Optional[str]:
    n = _normalize_name(name)
    for key, fam in MODEL_FAMILIES.items():
        if n == fam["id"] or n in fam["prefer"]:
            return key
    # Heurística por subcadena
    low = n.lower()
    if "cloud" in low or "31b" in low:
        return "cloud"
    if "12b" in low:
        return "12b"
    if "e4b" in low:
        return "e4b"
    if "e2b" in low:
        return "e2b"
    return None


# ══════════════════════════════════════════════════════════════════
#  Persistencia
# ══════════════════════════════════════════════════════════════════

def load_config() -> Dict[str, Any]:
    try:
        with open(_CONFIG_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        merged = {**DEFAULT_CONFIG, **{k: v for k, v in data.items() if k in DEFAULT_CONFIG}}
        if merged["engineMode"] not in VALID_ENGINE_MODES:
            merged["engineMode"] = DEFAULT_CONFIG["engineMode"]
        # Migrar ids antiguos (mlx / 31b-cloud) al canónico actual
        merged["manualModel"] = canonical_model_id(merged.get("manualModel") or DEFAULT_MODEL_ID)
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
#  Resolución cuantizado → normal (y cloud liviano)
# ══════════════════════════════════════════════════════════════════

def canonical_model_id(name: str) -> str:
    """Normaliza cualquier alias al id canónico de su familia."""
    fam_key = _family_for(name)
    if fam_key:
        return MODEL_FAMILIES[fam_key]["id"]
    return _normalize_name(name) or DEFAULT_MODEL_ID


def resolve_model_name(requested: str, installed_names: List[str]) -> str:
    """
    Resuelve el nombre pedido al modelo REAL instalado en Ollama.

    Orden:
      1. Preferencias de la familia (cuantizado → normal / cloud → 31b-cloud)
      2. Si la familia no está, degradar a e2b (q4 → normal)
      3. Si nada coincide, devolver el pedido (Ollama decidirá)
    """
    requested = _normalize_name(requested) or DEFAULT_MODEL_ID
    installed = _installed_set(installed_names)
    fam_key = _family_for(requested) or "e2b"
    prefer: List[str] = list(MODEL_FAMILIES[fam_key]["prefer"])

    if installed:
        for alias in prefer:
            if alias in installed:
                if alias != requested:
                    logger.info(f"Modelo '{requested}' → resuelto a '{alias}' (familia {fam_key})")
                return alias

        # Familia ausente: degradar a e2b cuantizado→normal
        if fam_key != "e2b":
            for alias in MODEL_FAMILIES["e2b"]["prefer"]:
                if alias in installed:
                    logger.warning(f"Familia '{fam_key}' no instalada; usando '{alias}'")
                    return alias

        # Último recurso: cualquier gemma4 instalado
        for name in installed:
            if name.startswith("gemma4:"):
                logger.warning(f"Usando gemma instalado disponible: '{name}'")
                return name

        return prefer[0] if prefer else requested

    # Sin tags (Ollama caído): devolver el cuantizado preferido de la familia
    return prefer[0] if prefer else requested


def resolve_cloud(installed_names: List[str]) -> str:
    """Cloud de menor consumo primero: gemma4:cloud → gemma4:31b-cloud."""
    return resolve_model_name(CLOUD_PREFERRED, installed_names)


def resolve_fast_local(installed_names: List[str]) -> str:
    """Modelo rápido para router/traductor: e2b-q4 → e2b."""
    return resolve_model_name(DEFAULT_MODEL_ID, installed_names)


def cloud_fallback_chain(installed_names: Optional[List[str]] = None) -> List[str]:
    """Cadena de fallback cloud ordenada por menor consumo."""
    installed = _installed_set(installed_names or [])
    chain = [CLOUD_PREFERRED, CLOUD_FALLBACK]
    if not installed:
        return chain
    return [n for n in chain if n in installed] or chain


def catalog_with_availability(installed_names: List[str]) -> List[Dict[str, Any]]:
    """Catálogo enriquecido con disponibilidad real y el nombre instalado resuelto."""
    installed = _installed_set(installed_names)
    result = []
    for entry in MODEL_CATALOG:
        resolved = resolve_model_name(entry["id"], installed_names)
        # Cloud: instalado solo si existe algún alias cloud real
        if entry["is_cloud"]:
            really_installed = any(a in installed for a in entry["aliases"])
        else:
            really_installed = any(a in installed for a in entry["aliases"])
        result.append({
            "id": entry["id"],
            "label": entry["label"],
            "ram": entry["ram"],
            "role": entry["role"],
            "isCloud": entry["is_cloud"],
            "installed": really_installed,
            "resolvedName": resolved,
            "preferOrder": list(entry["aliases"]),
        })
    return result
