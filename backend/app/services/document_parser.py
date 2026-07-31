import io
import logging
from typing import Optional, Tuple

import fitz  # PyMuPDF
import pytesseract
from PIL import Image

logger = logging.getLogger(__name__)


class DocumentParserService:
    @staticmethod
    async def parse_pdf(file_bytes: bytes) -> str:
        """Extract text from a PDF file."""
        text_content = []
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text = page.get_text()
                if text.strip():
                    text_content.append(text.strip())
            doc.close()
            return "\n\n".join(text_content)
        except Exception as e:
            logger.error(f"Error parsing PDF: {str(e)}")
            return f"Error extracting text from PDF: {str(e)}"

    @staticmethod
    async def parse_image(file_bytes: bytes) -> str:
        """Extract text from an image using OCR (Tesseract)."""
        try:
            image = Image.open(io.BytesIO(file_bytes))
            # Mejora ligera de contraste para OCR de etiquetas/recetas
            if image.mode not in ("L", "RGB"):
                image = image.convert("RGB")
            text = pytesseract.image_to_string(image, lang="spa+eng")
            return text.strip()
        except Exception as e:
            logger.error(f"Error parsing Image with OCR: {str(e)}")
            return f"Error extracting text from Image: {str(e)}"

    @staticmethod
    async def parse_plain_text(file_bytes: bytes) -> str:
        """Decode .txt / .csv / .md as UTF-8 (fallback latin-1)."""
        for encoding in ("utf-8", "utf-8-sig", "latin-1"):
            try:
                return file_bytes.decode(encoding).strip()
            except UnicodeDecodeError:
                continue
        return file_bytes.decode("utf-8", errors="replace").strip()

    @staticmethod
    def is_image(content_type: str) -> bool:
        return bool(content_type) and (
            content_type.startswith("image/") or content_type == "image"
        )

    @staticmethod
    def is_pdf(content_type: str) -> bool:
        return content_type in ("application/pdf", "pdf")

    @staticmethod
    def is_plain_text(content_type: str, filename: str = "") -> bool:
        name = (filename or "").lower()
        mime = (content_type or "").lower()
        if mime.startswith("text/") or mime in ("text", "txt", "csv", "excel"):
            return True
        return name.endswith((".txt", ".md", ".csv", ".tsv", ".json", ".log"))

    @staticmethod
    def classify(file_type: str, mime_type: str, filename: str = "") -> str:
        """Devuelve: image | pdf | text | unsupported"""
        mime = mime_type or ""
        ftype = file_type or ""
        if DocumentParserService.is_pdf(mime) or DocumentParserService.is_pdf(ftype) or (filename or "").lower().endswith(".pdf"):
            return "pdf"
        if DocumentParserService.is_image(mime) or DocumentParserService.is_image(ftype):
            return "image"
        if DocumentParserService.is_plain_text(mime, filename) or DocumentParserService.is_plain_text(ftype, filename):
            return "text"
        return "unsupported"

    @staticmethod
    async def extract(
        file_bytes: bytes,
        *,
        file_type: str = "",
        mime_type: str = "",
        filename: str = "",
    ) -> Tuple[str, str]:
        """
        Extrae texto del adjunto.
        Returns (kind, extracted_text) donde kind ∈ image|pdf|text|unsupported|error
        """
        kind = DocumentParserService.classify(file_type, mime_type, filename)
        try:
            if kind == "pdf":
                return kind, await DocumentParserService.parse_pdf(file_bytes)
            if kind == "image":
                return kind, await DocumentParserService.parse_image(file_bytes)
            if kind == "text":
                return kind, await DocumentParserService.parse_plain_text(file_bytes)
            return kind, f"[Archivo no soportado: {file_type or mime_type or filename}]"
        except Exception as e:
            logger.error(f"Error extrayendo adjunto: {e}")
            return "error", f"[Error procesando el archivo: {e}]"
