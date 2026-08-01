#!/usr/bin/env python3
"""
Generate downloadable specialty PDF summaries from the offline knowledge base.

No external deps: writes minimal valid PDF 1.4 files.
Output: public/kb/pdfs/*.pdf + public/kb/pdfs/manifest.json
Also mirrors under backend/app/data/kb/pdfs/
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.services.knowledge_base import KNOWLEDGE_BASE  # noqa: E402

OUT_DIRS = [
    ROOT / "public" / "kb" / "pdfs",
    ROOT / "backend" / "app" / "data" / "kb" / "pdfs",
]

# Group KB docs into specialty vault packs (one PDF per pack).
PACKS = [
    {
        "id": "aya-medicamentos",
        "title": "Aya — Salud y medicamentos (resumen MARU)",
        "agents": ["aya", "sumaq"],
        "filename": "aya-medicamentos.pdf",
        "match": ("minsa", "vadem", "medic", "anemia", "dengue", "tbc", "diabet", "salud"),
    },
    {
        "id": "inti-judicial",
        "title": "Inti — Legal y trámites (resumen MARU)",
        "agents": ["inti"],
        "filename": "inti-judicial.pdf",
        "match": ("cpc", "constituc", "legal", "tramite", "tramites", "codigo", "judicial", "laboral"),
    },
    {
        "id": "tupac-emergencia",
        "title": "Tupac — Emergencias e INDECI (resumen MARU)",
        "agents": ["tupac"],
        "filename": "tupac-emergencia.pdf",
        "match": ("indeci", "sismo", "huaico", "emergenc", "primeros", "kit", "evacu"),
    },
    {
        "id": "pacha-clima",
        "title": "Pacha — Clima y riesgo hidrológico (resumen MARU)",
        "agents": ["pacha"],
        "filename": "pacha-clima.pdf",
        "match": ("senamhi", "clima", "precip", "huaico", "enfen", "meteor"),
    },
    {
        "id": "yaku-peru",
        "title": "Yaku — Perú, cultura e inclusión (resumen MARU)",
        "agents": ["yaku"],
        "filename": "yaku-peru.pdf",
        "match": ("peru", "quechua", "cultura", "constituc", "historia", "inei", "idioma"),
    },
    {
        "id": "kipu-desarrollo",
        "title": "Kipu — Desarrollo local e IA (resumen MARU)",
        "agents": ["kipu"],
        "filename": "kipu-desarrollo.pdf",
        "match": ("gguf", "onnx", "ollama", "rag", "program", "modelo", "kipu", "docker"),
    },
]


def _latin1_safe(text: str) -> str:
    """PDF core fonts are Latin-1; strip/replace unsupported glyphs."""
    repl = {
        "—": "-",
        "–": "-",
        "“": '"',
        "”": '"',
        "‘": "'",
        "’": "'",
        "…": "...",
        "→": "->",
        "←": "<-",
        "°": " deg",
        "µ": "u",
        "ñ": "n",
        "Ñ": "N",
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
        "ü": "u",
        "Á": "A",
        "É": "E",
        "Í": "I",
        "Ó": "O",
        "Ú": "U",
        "¿": "?",
        "¡": "!",
    }
    for a, b in repl.items():
        text = text.replace(a, b)
    return text.encode("latin-1", errors="replace").decode("latin-1")


def _wrap(text: str, width: int = 92) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur = ""
    for w in words:
        trial = f"{cur} {w}".strip()
        if len(trial) <= width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [""]


def _doc_matches(pack: dict, doc: dict) -> bool:
    agents = set(doc.get("agents") or [])
    if not agents.intersection(pack["agents"]):
        # still allow keyword match for shared docs
        pass
    blob = " ".join(
        [
            doc.get("id", ""),
            doc.get("title", ""),
            doc.get("source", ""),
            " ".join(doc.get("keywords") or []),
        ]
    ).lower()
    if any(m in blob for m in pack["match"]):
        return True
    if agents.intersection(pack["agents"]) and any(
        a in agents for a in pack["agents"]
    ):
        # Prefer primary agent docs even without keyword hit
        return pack["agents"][0] in agents
    return False


def build_text_pages(pack: dict, docs: list[dict]) -> list[str]:
    lines: list[str] = []
    lines.append(pack["title"])
    lines.append("=" * min(80, len(pack["title"])))
    lines.append("")
    lines.append(
        "Documento generado por MARU OS a partir de la base de conocimiento offline."
    )
    lines.append(
        "Fuentes etiquetadas honestamente (resumenes MARU basados en normas/guias)."
    )
    lines.append("No sustituye asesoria medica, legal o de emergencia profesional.")
    lines.append("")

    if not docs:
        lines.append("(Sin documentos emparejados para este pack.)")
    for i, d in enumerate(docs, 1):
        lines.append(f"{i}. {d.get('title', d.get('id'))}")
        lines.append(f"Fuente: {d.get('source', 'N/D')}")
        lines.append(f"Agentes: {', '.join(d.get('agents') or [])}")
        body = re.sub(r"\s+", " ", str(d.get("body") or "")).strip()
        # Keep PDFs readable / bounded
        if len(body) > 1800:
            body = body[:1800] + "..."
        for wrapped in _wrap(body, 92):
            lines.append(wrapped)
        lines.append("")

    # Paginate ~48 lines per page
    pages: list[str] = []
    page_lines: list[str] = []
    for line in lines:
        page_lines.append(line)
        if len(page_lines) >= 48:
            pages.append("\n".join(page_lines))
            page_lines = []
    if page_lines:
        pages.append("\n".join(page_lines))
    return pages


def write_simple_pdf(path: Path, pages_text: list[str]) -> None:
    """Minimal multi-page PDF with Helvetica text."""
    objects: list[bytes] = []

    def add(obj: bytes) -> int:
        objects.append(obj)
        return len(objects)

    # 1: Catalog
    add(b"<< /Type /Catalog /Pages 2 0 R >>")
    # 2: Pages placeholder — filled later
    pages_obj_index = 2
    objects.append(b"")  # placeholder

    page_ids: list[int] = []
    for page_text in pages_text:
        safe = _latin1_safe(page_text)
        content_lines = ["BT", "/F1 10 Tf", "50 780 Td", "14 TL"]
        first = True
        for line in safe.split("\n"):
            esc = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
            if first:
                content_lines.append(f"({esc}) Tj")
                first = False
            else:
                content_lines.append("T*")
                content_lines.append(f"({esc}) Tj")
        content_lines.append("ET")
        stream = "\n".join(content_lines).encode("latin-1", errors="replace")
        content_id = add(
            b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"\nendstream"
        )
        page_id = add(
            (
                f"<< /Type /Page /Parent {pages_obj_index} 0 R "
                f"/MediaBox [0 0 612 792] "
                f"/Contents {content_id} 0 R "
                f"/Resources << /Font << /F1 {0} 0 R >> >> >>"
            ).encode("latin-1")
        )
        page_ids.append(page_id)

    # Font object
    font_id = add(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    # Patch page resources font refs
    for pid in page_ids:
        raw = objects[pid - 1]
        objects[pid - 1] = raw.replace(b"/F1 0 0 R", f"/F1 {font_id} 0 R".encode())

    kids = " ".join(f"{pid} 0 R" for pid in page_ids)
    objects[1] = (
        f"<< /Type /Pages /Kids [{kids}] /Count {len(page_ids)} >>".encode("latin-1")
    )

    # Write file
    out = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for i, obj in enumerate(objects, 1):
        offsets.append(len(out))
        out.extend(f"{i} 0 obj\n".encode())
        out.extend(obj)
        out.extend(b"\nendobj\n")
    xref_pos = len(out)
    out.extend(f"xref\n0 {len(objects) + 1}\n".encode())
    out.extend(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        out.extend(f"{off:010d} 00000 n \n".encode())
    out.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_pos}\n%%EOF\n".encode()
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(out)


def main() -> None:
    manifest_docs = []
    for pack in PACKS:
        docs = [d for d in KNOWLEDGE_BASE if _doc_matches(pack, d)]
        # de-dupe by id, keep order
        seen = set()
        uniq = []
        for d in docs:
            if d["id"] in seen:
                continue
            seen.add(d["id"])
            uniq.append(d)
        pages = build_text_pages(pack, uniq[:14])
        for out_dir in OUT_DIRS:
            write_simple_pdf(out_dir / pack["filename"], pages)
        entry = {
            "id": pack["id"],
            "title": pack["title"],
            "filename": pack["filename"],
            "url": f"/kb/pdfs/{pack['filename']}",
            "agents": pack["agents"],
            "documentCount": len(uniq[:14]),
            "disclaimer": "Resumen MARU offline — no sustituye fuentes oficiales completas.",
        }
        manifest_docs.append(entry)
        print(f"OK {pack['filename']} ({entry['documentCount']} docs)")

    manifest = {
        "generatedBy": "scripts/generate_kb_pdfs.py",
        "count": len(manifest_docs),
        "pdfs": manifest_docs,
    }
    for out_dir in OUT_DIRS:
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "manifest.json").write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    print(f"Wrote {len(manifest_docs)} PDFs + manifest")


if __name__ == "__main__":
    main()
