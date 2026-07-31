"""
Bóveda documental local (RAG de usuario).

- Indexa PDFs/imágenes/texto subidos por el usuario.
- Persistencia JSON offline (sin depender de Qdrant).
- Búsqueda léxica por agente + opcional upsert en Qdrant.
"""

from __future__ import annotations

import json
import logging
import os
import re
import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

_VAULT_PATH = os.getenv(
    "MARU_VAULT_PATH",
    os.path.join(os.path.dirname(__file__), "..", "data", "document_vault.json"),
)
_lock = threading.Lock()
_MAX_CHUNK = 1200
_CHUNK_OVERLAP = 150


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load() -> Dict[str, Any]:
    try:
        with open(_VAULT_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict) and "documents" in data:
            return data
    except FileNotFoundError:
        pass
    except Exception as e:
        logger.warning(f"Vault corrupto, reiniciando: {e}")
    return {"documents": []}


def _save(data: Dict[str, Any]) -> None:
    os.makedirs(os.path.dirname(os.path.abspath(_VAULT_PATH)), exist_ok=True)
    with open(_VAULT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def chunk_text(text: str, max_len: int = _MAX_CHUNK, overlap: int = _CHUNK_OVERLAP) -> List[str]:
    text = (text or "").strip()
    if not text:
        return []
    if len(text) <= max_len:
        return [text]

    chunks: List[str] = []
    start = 0
    while start < len(text):
        end = min(len(text), start + max_len)
        # Preferir cortes en párrafo/oración
        if end < len(text):
            cut = text.rfind("\n\n", start, end)
            if cut < start + max_len // 3:
                cut = text.rfind(". ", start, end)
            if cut >= start + max_len // 3:
                end = cut + 1
        piece = text[start:end].strip()
        if piece:
            chunks.append(piece)
        if end >= len(text):
            break
        start = max(end - overlap, start + 1)
    return chunks


def _tokenize(text: str) -> set:
    return {t for t in re.findall(r"[a-záéíóúñü0-9]{3,}", (text or "").lower())}


def index_document(
    *,
    name: str,
    text: str,
    agent_id: str = "inti",
    mime_type: str = "application/pdf",
    source: str = "upload",
) -> Dict[str, Any]:
    """Indexa un documento en la bóveda local. Devuelve metadata del doc."""
    chunks = chunk_text(text)
    if not chunks:
        raise ValueError("No se pudo extraer texto útil del documento")

    doc_id = f"doc_{uuid.uuid4().hex[:12]}"
    entry = {
        "id": doc_id,
        "name": name,
        "agentId": agent_id,
        "mimeType": mime_type,
        "source": source,
        "indexedAt": _now(),
        "charCount": len(text),
        "chunkCount": len(chunks),
        "preview": text[:280].strip(),
        "chunks": chunks,
    }

    with _lock:
        data = _load()
        data["documents"].insert(0, entry)
        # Cap suave para no crecer sin límite en offline
        data["documents"] = data["documents"][:80]
        _save(data)

    return {k: v for k, v in entry.items() if k != "chunks"}


def list_documents(agent_id: Optional[str] = None) -> List[Dict[str, Any]]:
    with _lock:
        docs = _load().get("documents", [])
    result = []
    for d in docs:
        if agent_id and d.get("agentId") != agent_id:
            continue
        result.append({k: v for k, v in d.items() if k != "chunks"})
    return result


def search_vault(query: str, agent_id: Optional[str] = None, limit: int = 3) -> List[Dict[str, Any]]:
    """Búsqueda léxica offline sobre chunks indexados."""
    q_tokens = _tokenize(query)
    if not q_tokens:
        return []

    with _lock:
        docs = _load().get("documents", [])

    scored: List[tuple] = []
    for doc in docs:
        if agent_id and doc.get("agentId") != agent_id:
            # Inti/legal: también buscar docs sin filtro estricto si agent es inti
            if agent_id != "inti":
                continue
        for i, chunk in enumerate(doc.get("chunks") or []):
            c_tokens = _tokenize(chunk)
            overlap = len(q_tokens & c_tokens)
            if overlap == 0:
                # Bonus si el nombre del archivo aparece
                name_hit = 1 if any(t in (doc.get("name") or "").lower() for t in q_tokens) else 0
                if not name_hit:
                    continue
                overlap = name_hit
            score = overlap / max(len(q_tokens), 1)
            scored.append((score, {
                "docId": doc.get("id"),
                "name": doc.get("name"),
                "agentId": doc.get("agentId"),
                "chunkIndex": i,
                "text": chunk,
                "score": round(score, 3),
            }))

    scored.sort(key=lambda x: x[0], reverse=True)
    # Deduplicar por documento
    seen = set()
    out = []
    for _, hit in scored:
        key = hit["docId"]
        if key in seen:
            continue
        seen.add(key)
        out.append(hit)
        if len(out) >= limit:
            break
    return out


def build_vault_context(query: str, agent_id: Optional[str] = None, limit: int = 3) -> str:
    hits = search_vault(query, agent_id=agent_id, limit=limit)
    if not hits:
        return ""
    lines = ["[BÓVEDA DOCUMENTAL DEL USUARIO — fuentes indexadas localmente]"]
    for h in hits:
        excerpt = (h.get("text") or "")[:900]
        lines.append(f"• {h.get('name')} (relevancia {h.get('score')}):\n{excerpt}")
    return "\n\n".join(lines)
