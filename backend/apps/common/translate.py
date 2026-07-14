"""EN → ZH translation helpers for operations review."""

from __future__ import annotations

import hashlib
import json
import logging
import random
import re
import urllib.error
import urllib.parse
import urllib.request
from typing import Callable

from django.conf import settings

from .text import sanitize_rich_text_html

logger = logging.getLogger(__name__)

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")

# Per-provider chunk limits (chars)
_CHUNK_GOOGLE = 1800
_CHUNK_MYMEMORY = 450
_CHUNK_BAIDU = 1800


def _request_timeout() -> int:
    return getattr(settings, "TRANSLATE_REQUEST_TIMEOUT", 12)


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


def _chunk_text(text: str, size: int) -> list[str]:
    if len(text) <= size:
        return [text] if text else []
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        if end < len(text):
            window = text[start:end]
            break_at = max(
                window.rfind("。"),
                window.rfind("."),
                window.rfind("!"),
                window.rfind("?"),
                window.rfind(" "),
            )
            if break_at > size // 3:
                end = start + break_at + 1
        piece = text[start:end].strip()
        if piece:
            chunks.append(piece)
        start = end
    return chunks


def _http_get_json(url: str, timeout: int | None = None) -> dict:
    if timeout is None:
        timeout = _request_timeout()
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 ConradSysTranslate/1.0"},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _http_post_form(url: str, data: dict, timeout: int | None = None) -> dict:
    if timeout is None:
        timeout = _request_timeout()
    body = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "User-Agent": "Mozilla/5.0 ConradSysTranslate/1.0",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _translate_chunk_baidu(text: str) -> str:
    app_id = getattr(settings, "BAIDU_TRANSLATE_APP_ID", "") or ""
    secret = getattr(settings, "BAIDU_TRANSLATE_SECRET", "") or ""
    if not app_id or not secret:
        raise RuntimeError("Baidu translate not configured")

    salt = str(random.randint(32768, 65536))
    sign = hashlib.md5(f"{app_id}{text}{salt}{secret}".encode()).hexdigest()
    data = _http_post_form(
        "https://fanyi-api.baidu.com/api/trans/vip/translate",
        {
            "q": text,
            "from": "en",
            "to": "zh",
            "appid": app_id,
            "salt": salt,
            "sign": sign,
        },
    )
    if "error_code" in data:
        raise RuntimeError(f"Baidu error {data.get('error_code')}")
    trans = data.get("trans_result") or []
    parts = [item.get("dst", "") for item in trans if isinstance(item, dict)]
    result = "\n".join(p for p in parts if p).strip()
    if not result:
        raise RuntimeError("Baidu returned empty translation")
    return result


def _translate_chunk_mymemory(text: str) -> str:
    params = urllib.parse.urlencode({"q": text, "langpair": "en|zh-CN"})
    url = f"https://api.mymemory.translated.net/get?{params}"
    data = _http_get_json(url)
    translated = (data.get("responseData") or {}).get("translatedText", "").strip()
    if not translated:
        raise RuntimeError("MyMemory returned empty translation")
    # MyMemory returns the source text when quota is exceeded
    if translated.upper() == "QUERY LENGTH LIMIT EXCEEDED MAX. ALLOWED QUERY : 500 CHARS":
        raise RuntimeError("MyMemory chunk too long")
    if translated == text:
        raise RuntimeError("MyMemory returned unchanged text")
    return translated


def _translate_chunk_google(text: str) -> str:
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
    data = _http_get_json(url)
    parts: list[str] = []
    if isinstance(data, list) and data and isinstance(data[0], list):
        for item in data[0]:
            if isinstance(item, list) and item and isinstance(item[0], str):
                parts.append(item[0])
    result = "".join(parts).strip()
    if not result:
        raise RuntimeError("Google returned empty translation")
    return result


ProviderFn = Callable[[str], str]


def _provider_chain() -> list[tuple[str, ProviderFn, int]]:
    """Order tuned for Aliyun / China servers: Baidu → MyMemory → Google."""
    chain: list[tuple[str, ProviderFn, int]] = []
    if getattr(settings, "BAIDU_TRANSLATE_APP_ID", "") and getattr(
        settings, "BAIDU_TRANSLATE_SECRET", ""
    ):
        chain.append(("baidu", _translate_chunk_baidu, _CHUNK_BAIDU))
    chain.extend(
        [
            ("mymemory", _translate_chunk_mymemory, _CHUNK_MYMEMORY),
            ("google", _translate_chunk_google, _CHUNK_GOOGLE),
        ]
    )
    return chain


def _translate_chunk(text: str) -> str:
    errors: list[str] = []
    for name, fn, _ in _provider_chain():
        try:
            result = fn(text)
            logger.info("Translated chunk via %s (%d chars)", name, len(text))
            return result
        except Exception as exc:  # noqa: BLE001 — collect and try next provider
            errors.append(f"{name}: {exc}")
            logger.warning("Translate provider %s failed: %s", name, exc)
    raise RuntimeError(
        "所有翻译服务均不可用，请稍后重试。"
        + (f" ({'; '.join(errors[:3])})" if errors else "")
    )


def translate_en_to_zh(html_or_text: str) -> str:
    text = plain_text_from_html(html_or_text)
    if not text:
        return ""

    # Use the smallest chunk size among configured providers so every provider can handle each piece
    chain = _provider_chain()
    chunk_size = min(size for _, _, size in chain)

    translated_parts: list[str] = []
    for chunk in _chunk_text(text, chunk_size):
        translated_parts.append(_translate_chunk(chunk))

    return "\n".join(p for p in translated_parts if p).strip()
