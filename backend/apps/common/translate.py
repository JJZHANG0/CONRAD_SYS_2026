"""EN → ZH translation helpers for operations review."""

from __future__ import annotations

import json
import re
import urllib.error
import urllib.parse
import urllib.request

from .text import sanitize_rich_text_html

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")
_CHUNK = 1800


def plain_text_from_html(value: str) -> str:
    cleaned = sanitize_rich_text_html(value or "")
    text = _TAG_RE.sub(" ", cleaned)
    text = (
        text.replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", '"')
    )
    return _WS_RE.sub(" ", text).strip()


def _chunk_text(text: str, size: int = _CHUNK) -> list[str]:
    if len(text) <= size:
        return [text] if text else []
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        if end < len(text):
            # Prefer breaking on sentence / space boundaries
            window = text[start:end]
            break_at = max(window.rfind("。"), window.rfind("."), window.rfind("!"), window.rfind("?"), window.rfind(" "))
            if break_at > size // 3:
                end = start + break_at + 1
        chunks.append(text[start:end].strip())
        start = end
    return [c for c in chunks if c]


def _translate_chunk_google(text: str) -> str:
    """Use Google Translate gtx endpoint (no API key required)."""
    params = urllib.parse.urlencode(
        {
            "client": "gtx",
            "sl": "en",
            "tl": "zh-CN",
            "dt": "t",
            "q": text,
        }
    )
    url = f"https://translate.googleapis.com/translate_a/single?{params}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 ConradSysTranslate/1.0"},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        raw = resp.read().decode("utf-8")
    data = json.loads(raw)
    parts = []
    if isinstance(data, list) and data and isinstance(data[0], list):
        for item in data[0]:
            if isinstance(item, list) and item and isinstance(item[0], str):
                parts.append(item[0])
    return "".join(parts).strip()


def translate_en_to_zh(html_or_text: str) -> str:
    text = plain_text_from_html(html_or_text)
    if not text:
        return ""

    # Already mostly Chinese — still pass through for mixed content
    translated_parts: list[str] = []
    for chunk in _chunk_text(text):
        try:
            translated_parts.append(_translate_chunk_google(chunk))
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError, ValueError) as exc:
            raise RuntimeError(f"Translation service unavailable: {exc}") from exc

    return "\n".join(p for p in translated_parts if p).strip()
