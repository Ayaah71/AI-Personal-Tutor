"""Text extraction from PDF, DOCX and plain-text files."""

import io
from pathlib import Path


def extract_text(filename: str, content: bytes) -> tuple[str, int]:
    """
    Returns (extracted_text, page_count).
    page_count is meaningful only for PDFs; other formats return 1.
    """
    ext = Path(filename).suffix.lower()

    if ext == ".pdf":
        return _extract_pdf(content)
    elif ext in (".docx", ".doc"):
        return _extract_docx(content)
    else:
        # plain text / markdown
        text = content.decode("utf-8", errors="replace")
        return text, 1


def _extract_pdf(content: bytes) -> tuple[str, int]:
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=content, filetype="pdf")
        pages = []
        for page in doc:
            pages.append(page.get_text())
        doc.close()
        return "\n\n".join(pages), len(pages)
    except ImportError:
        raise RuntimeError("PyMuPDF not installed. Run: pip install PyMuPDF")


def _extract_docx(content: bytes) -> tuple[str, int]:
    try:
        from docx import Document

        doc = Document(io.BytesIO(content))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs), 1
    except ImportError:
        raise RuntimeError("python-docx not installed. Run: pip install python-docx")
