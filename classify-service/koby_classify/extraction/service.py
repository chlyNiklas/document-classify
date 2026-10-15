from io import BytesIO
from pathlib import Path
from zipfile import BadZipFile, ZipFile

from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph
from pypdf import PdfReader


DOCX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
MAX_DOCX_UNCOMPRESSED_BYTES = 50 * 1024 * 1024


class DocumentExtractionError(Exception):
    pass


class UnsupportedDocumentTypeError(DocumentExtractionError):
    pass


class EmptyDocumentError(DocumentExtractionError):
    pass


class DocumentTooLongError(DocumentExtractionError):
    pass


def extract_text(
    content: bytes,
    filename: str | None,
    content_type: str | None,
    max_characters: int,
) -> str:
    document_type = _document_type(filename, content_type)

    if document_type == "pdf":
        text = _extract_pdf(content)
    elif document_type == "docx":
        text = _extract_docx(content)
    else:
        text = _extract_plain_text(content)

    text = text.strip()
    if not text:
        message = "No extractable text was found in the uploaded document"
        if document_type == "pdf":
            message += "; scanned PDFs require OCR, which is not supported yet"
        raise EmptyDocumentError(message)

    if len(text) > max_characters:
        raise DocumentTooLongError(
            f"Extracted text exceeds the {max_characters} character limit"
        )

    return text


def _document_type(filename: str | None, content_type: str | None) -> str:
    extension = Path(filename or "").suffix.lower()
    by_extension = {
        ".pdf": "pdf",
        ".docx": "docx",
        ".md": "markdown",
        ".txt": "text",
    }
    if extension in by_extension:
        return by_extension[extension]

    normalized_content_type = (content_type or "").partition(";")[0].strip().lower()
    by_content_type = {
        "application/pdf": "pdf",
        DOCX_CONTENT_TYPE: "docx",
        "text/markdown": "markdown",
        "text/plain": "text",
    }
    if normalized_content_type in by_content_type:
        return by_content_type[normalized_content_type]

    raise UnsupportedDocumentTypeError(
        "Only PDF, DOCX, Markdown, and plain-text files are supported"
    )


def _extract_pdf(content: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(content))
        if reader.is_encrypted:
            raise DocumentExtractionError("Encrypted PDFs are not supported")
        return "\n\n".join(page.extract_text() or "" for page in reader.pages)
    except DocumentExtractionError:
        raise
    except Exception as error:
        raise DocumentExtractionError("The uploaded PDF could not be read") from error


def _extract_docx(content: bytes) -> str:
    try:
        _validate_docx_archive(content)
        document = Document(BytesIO(content))
        blocks: list[str] = []
        for block in document.iter_inner_content():
            if isinstance(block, Paragraph):
                blocks.append(block.text)
            elif isinstance(block, Table):
                blocks.extend(_extract_table_rows(block))
        return "\n".join(blocks)
    except DocumentExtractionError:
        raise
    except Exception as error:
        raise DocumentExtractionError("The uploaded DOCX could not be read") from error


def _validate_docx_archive(content: bytes) -> None:
    try:
        with ZipFile(BytesIO(content)) as archive:
            names = set(archive.namelist())
            if "[Content_Types].xml" not in names or "word/document.xml" not in names:
                raise DocumentExtractionError("The uploaded file is not a valid DOCX")
            if sum(entry.file_size for entry in archive.infolist()) > MAX_DOCX_UNCOMPRESSED_BYTES:
                raise DocumentExtractionError("The uncompressed DOCX is too large")
    except BadZipFile as error:
        raise DocumentExtractionError("The uploaded file is not a valid DOCX") from error


def _extract_table_rows(table: Table) -> list[str]:
    rows: list[str] = []
    for row in table.rows:
        cells = [" ".join(paragraph.text for paragraph in cell.paragraphs) for cell in row.cells]
        rows.append("\t".join(cells))
    return rows


def _extract_plain_text(content: bytes) -> str:
    try:
        return content.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise DocumentExtractionError("Plain-text files must use UTF-8 encoding") from error
