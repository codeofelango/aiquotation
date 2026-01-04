import io
from pypdf import PdfReader
import logging

logger = logging.getLogger("uvicorn")

def extract_text_from_pdf(file_content: bytes) -> str:
    """
    Extracts raw text from a PDF file.
    """
    try:
        if not file_content:
            logger.warning("Empty file content received")
            return ""

        reader = PdfReader(io.BytesIO(file_content))
        
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except:
                logger.warning("PDF is encrypted and could not be decrypted with empty password")
        
        text = ""
        for i, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            except Exception as e:
                logger.warning(f"Error extracting text from page {i}: {e}")
                continue
                
        return text.strip()
    except Exception as e:
        logger.error(f"Error reading PDF: {e}")
        return ""