import io
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import logging

logger = logging.getLogger(__name__)

class DocumentParserService:
    @staticmethod
    async def parse_pdf(file_bytes: bytes) -> str:
        """Extract text from a PDF file."""
        text_content = []
        try:
            # Open PDF from bytes
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
            # Optional: Image preprocessing could go here (e.g., converting to grayscale)
            # image = image.convert('L')
            
            text = pytesseract.image_to_string(image, lang='spa+eng')  # Default to Spanish + English
            return text.strip()
        except Exception as e:
            logger.error(f"Error parsing Image with OCR: {str(e)}")
            return f"Error extracting text from Image: {str(e)}"

    @staticmethod
    def is_image(content_type: str) -> bool:
        return content_type.startswith('image/')
        
    @staticmethod
    def is_pdf(content_type: str) -> bool:
        return content_type == 'application/pdf'
