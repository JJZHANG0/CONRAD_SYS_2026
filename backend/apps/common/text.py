import html
import re
from html.parser import HTMLParser

_CLIPBOARD_RE = re.compile(r"<sc-clipboard[\s\S]*?</sc-clipboard>", re.IGNORECASE)
_CLIPBOARD_TAG_RE = re.compile(r"</?sc-clipboard[^>]*>", re.IGNORECASE)
_DATA_ATTR_RE = re.compile(r'\sdata-[\w-]+="[^"]*"', re.IGNORECASE)
_SPAN_CLASS_RE = re.compile(r'<span[^>]*class="[^"]*css-[^"]*"[^>]*>', re.IGNORECASE)
_SCRIPT_RE = re.compile(r"<(script|style)[^>]*>[\s\S]*?</\1>", re.IGNORECASE)
_BLOCK_TAGS = {
    "p",
    "div",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "tr",
    "ul",
    "ol",
}
_SKIP_TAGS = {"script", "style"}
_LINE_SPACE_RE = re.compile(r"[ \t\f\v]+")


def clean_rich_text(value):
    if value is None:
        return ""
    if not isinstance(value, str):
        return str(value)
    return value.replace("\x00", "").replace("\u200b", "")


def _normalize_line(text: str) -> str:
    return _LINE_SPACE_RE.sub(" ", text.replace("\u00a0", " ")).strip()


class _ParagraphParser(HTMLParser):
    """Turn editor HTML into plain lines, keeping Enter and blank lines."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self._stack = [{"buffer": "", "blocks": [], "tag": ""}]
        self._skip = 0

    def _top(self):
        return self._stack[-1]

    def _flush(self):
        frame = self._top()
        frame["blocks"].append(_normalize_line(frame["buffer"]))
        frame["buffer"] = ""

    def _append(self, data: str):
        parts = data.replace("\r\n", "\n").replace("\r", "\n").split("\n")
        self._top()["buffer"] += parts[0]
        for part in parts[1:]:
            self._flush()
            self._top()["buffer"] += part

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if self._skip:
            if tag in _SKIP_TAGS:
                self._skip += 1
            return
        if tag in _SKIP_TAGS:
            self._skip = 1
            return
        if tag == "br":
            self._flush()
            return
        if tag in _BLOCK_TAGS:
            if self._top()["buffer"]:
                self._flush()
            self._stack.append({"buffer": "", "blocks": [], "tag": tag})

    def handle_startendtag(self, tag, attrs):
        tag = tag.lower()
        if tag == "br":
            self.handle_starttag(tag, attrs)
            return
        if tag in _BLOCK_TAGS:
            if self._top()["buffer"]:
                self._flush()
            self._top()["blocks"].append("")
            return
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        tag = tag.lower()
        if self._skip:
            if tag in _SKIP_TAGS:
                self._skip = max(0, self._skip - 1)
            return
        if tag not in _BLOCK_TAGS or len(self._stack) <= 1:
            return
        if self._stack[-1].get("tag") != tag:
            return
        frame = self._stack.pop()
        if frame["buffer"]:
            frame["blocks"].append(_normalize_line(frame["buffer"]))
        blocks = frame["blocks"] or [""]
        self._top()["blocks"].extend(blocks)

    def handle_data(self, data):
        if self._skip or not data:
            return
        # Newlines between block tags are markup, not a blank line the user typed.
        if not data.strip() and not self._top()["buffer"]:
            return
        self._append(data)

    def lines(self) -> list[str]:
        while len(self._stack) > 1:
            frame = self._stack.pop()
            if frame["buffer"]:
                frame["blocks"].append(_normalize_line(frame["buffer"]))
            self._top()["blocks"].extend(frame["blocks"] or [""])
        root = self._stack[0]
        if root["buffer"]:
            root["blocks"].append(_normalize_line(root["buffer"]))
        lines = root["blocks"]
        while lines and not lines[0]:
            lines.pop(0)
        while lines and not lines[-1]:
            lines.pop()
        return lines


def _paragraphs_html(lines: list[str]) -> str:
    if not lines:
        return ""
    parts = []
    for line in lines:
        if line:
            parts.append(f"<p>{html.escape(line, quote=False)}</p>")
        else:
            parts.append("<p><br></p>")
    return "".join(parts)


def sanitize_rich_text_html(value: str) -> str:
    """Keep line breaks and blank-line paragraphs; drop unsafe markup."""
    if not value:
        return ""
    cleaned = _CLIPBOARD_RE.sub("", value)
    cleaned = _CLIPBOARD_TAG_RE.sub("", cleaned)
    cleaned = _SCRIPT_RE.sub("", cleaned)
    cleaned = _DATA_ATTR_RE.sub("", cleaned)
    cleaned = _SPAN_CLASS_RE.sub("", cleaned)
    cleaned = cleaned.replace("</span>", " ")
    cleaned = clean_rich_text(cleaned)
    parser = _ParagraphParser()
    parser.feed(cleaned)
    parser.close()
    return _paragraphs_html(parser.lines())
