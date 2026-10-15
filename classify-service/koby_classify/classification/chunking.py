def chunk_text(text: str, max_characters: int) -> list[str]:
    if max_characters <= 0:
        raise ValueError("max_characters must be greater than zero")

    stripped = text.strip()
    if len(stripped) <= max_characters:
        return [stripped]

    chunks: list[str] = []
    start = 0
    text_length = len(text)
    minimum_break_offset = int(max_characters * 0.6)

    while start < text_length:
        end = min(start + max_characters, text_length)
        if end < text_length:
            window = text[start:end]
            for boundary in ("\n\n", "\n", ". ", " "):
                boundary_index = window.rfind(boundary, minimum_break_offset)
                if boundary_index >= 0:
                    end = start + boundary_index + len(boundary)
                    break

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end

    return chunks
