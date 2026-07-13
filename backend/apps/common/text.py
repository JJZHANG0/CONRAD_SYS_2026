import re

_CLIPBOARD_RE = re.compile(r"<sc-clipboard[\s\S]*?</sc-clipboard>", re.IGNORECASE)
_CLIPBOARD_TAG_RE = re.compile(r"</?sc-clipboard[^>]*>", re.IGNORECASE)
_DATA_ATTR_RE = re.compile(r'\sdata-[\w-]+="[^"]*"', re.IGNORECASE)
_SPAN_CLASS_RE = re.compile(r'<span[^>]*class="[^"]*css-[^"]*"[^>]*>', re.IGNORECASE)


def sanitize_rich_text_html(value: str) -> str:
    if not value:
        return ""
    cleaned = _CLIPBOARD_RE.sub("", value)
    cleaned = _CLIPBOARD_TAG_RE.sub("", cleaned)
    cleaned = _DATA_ATTR_RE.sub("", cleaned)
    cleaned = _SPAN_CLASS_RE.sub("", cleaned)
    cleaned = cleaned.replace("</span>", " ")
    cleaned = clean_rich_text(cleaned)
    text = re.sub(r"<[^>]+>", " ", cleaned)
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return ""
    return f"<p>{text}</p>"


def clean_rich_text(value):
    if value is None:
        return ""
    if not isinstance(value, str):
        return str(value)
    return value.replace("\x00", "")
