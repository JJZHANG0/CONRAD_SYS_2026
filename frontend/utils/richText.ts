/** Strip HTML and keep paragraph breaks for counting, preview, and translation. */
export function stripHtml(html: string): string {
  const normalized = sanitizeRichTextHtml(html);
  if (!normalized) return "";
  const withBreaks = normalized
    .replace(/<p><br><\/p>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeHtmlEntities(withBreaks)
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const BLOCK_TAGS = new Set([
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
]);

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, "\u00a0")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)))
    .replace(/&#x([0-9a-f]+);/gi, (_, num) => String.fromCodePoint(parseInt(num, 16)))
    .replace(/&amp;/gi, "&");
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function normalizeLine(text: string): string {
  return text.replace(/\u00a0/g, " ").replace(/[ \t\f\v]+/g, " ").trim();
}

type Frame = { buffer: string; blocks: string[]; tag: string };

/** Turn editor HTML into plain lines. Enter and blank lines stay as separate lines. */
function extractLines(html: string): string[] {
  const stack: Frame[] = [{ buffer: "", blocks: [], tag: "" }];
  let skip = 0;
  const top = () => stack[stack.length - 1];
  const flush = () => {
    const frame = top();
    frame.blocks.push(normalizeLine(frame.buffer));
    frame.buffer = "";
  };
  const append = (data: string) => {
    const parts = data.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    top().buffer += parts[0];
    for (let i = 1; i < parts.length; i += 1) {
      flush();
      top().buffer += parts[i];
    }
  };

  const tokenRe =
    /<!--[\s\S]*?-->|<\/([a-zA-Z0-9]+)\s*>|<([a-zA-Z0-9]+)(\s[^>]*?)?\s*\/?>|([^<]+)/g;
  let index = 0;
  let match: RegExpExecArray | null;
  while (index < html.length) {
    tokenRe.lastIndex = index;
    match = tokenRe.exec(html);
    if (!match || match.index !== index) {
      if (html[index] === "<") {
        append("<");
        index += 1;
        continue;
      }
      const next = html.indexOf("<", index);
      const chunk = html.slice(index, next === -1 ? html.length : next);
      append(decodeHtmlEntities(chunk));
      index += chunk.length;
      continue;
    }
    index = tokenRe.lastIndex;
    if (match[0].startsWith("<!--")) continue;
    if (match[1]) {
      const tag = match[1].toLowerCase();
      if (skip) {
        if (tag === "script" || tag === "style") skip = Math.max(0, skip - 1);
        continue;
      }
      if (!BLOCK_TAGS.has(tag) || stack.length <= 1 || stack[stack.length - 1].tag !== tag) {
        continue;
      }
      const frame = stack.pop()!;
      if (frame.buffer) frame.blocks.push(normalizeLine(frame.buffer));
      top().blocks.push(...(frame.blocks.length ? frame.blocks : [""]));
      continue;
    }
    if (match[2]) {
      const tag = match[2].toLowerCase();
      const selfClosing = match[0].endsWith("/>");
      if (skip) {
        if (tag === "script" || tag === "style") skip += 1;
        continue;
      }
      if (tag === "script" || tag === "style") {
        skip += 1;
        continue;
      }
      if (tag === "br") {
        flush();
        continue;
      }
      if (BLOCK_TAGS.has(tag)) {
        if (top().buffer) flush();
        if (selfClosing) {
          top().blocks.push("");
        } else {
          stack.push({ buffer: "", blocks: [], tag });
        }
      }
      continue;
    }
    if (match[4] && !skip) {
      const decoded = decodeHtmlEntities(match[4]);
      // Newlines between block tags are markup, not a blank line the user typed.
      if (!decoded.trim() && !top().buffer) continue;
      append(decoded);
    }
  }

  while (stack.length > 1) {
    const frame = stack.pop()!;
    if (frame.buffer) frame.blocks.push(normalizeLine(frame.buffer));
    top().blocks.push(...(frame.blocks.length ? frame.blocks : [""]));
  }
  const root = stack[0];
  if (root.buffer) root.blocks.push(normalizeLine(root.buffer));
  while (root.blocks.length && !root.blocks[0]) root.blocks.shift();
  while (root.blocks.length && !root.blocks[root.blocks.length - 1]) root.blocks.pop();
  return root.blocks;
}

function paragraphsHtml(lines: string[]): string {
  if (!lines.length) return "";
  return lines
    .map((line) => (line ? `<p>${escapeHtml(line)}</p>` : "<p><br></p>"))
    .join("");
}

/** Remove paste junk and unsafe markup, but keep line breaks and blank paragraphs. */
export function sanitizeRichTextHtml(html: string): string {
  if (!html) return "";
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<sc-clipboard[\s\S]*?<\/sc-clipboard>/gi, "")
    .replace(/<\/?sc-clipboard[^>]*>/gi, "")
    .replace(/\sdata-[\w-]+="[^"]*"/gi, "")
    .replace(/\sdata-[\w-]+='[^']*'/gi, "")
    .replace(/<span[^>]*class="[^"]*css-[^"]*"[^>]*>/gi, "")
    .replace(/<\/span>/gi, " ")
    .replace(/\u0000/g, "")
    .replace(/\u200b/g, "");
  return paragraphsHtml(extractLines(cleaned));
}

export function getPlainTextLength(html: string): number {
  return stripHtml(html).length;
}

export function isRichTextEmpty(html: string): boolean {
  return getPlainTextLength(html) === 0;
}

/** Normalize editor output — strip paste junk, empty content becomes "" */
export function normalizeRichText(html: string): string {
  if (isRichTextEmpty(html)) return "";
  return sanitizeRichTextHtml(html);
}

export function plainTextPreview(html: string, maxLen = 80): string {
  const text = stripHtml(html).replace(/\n+/g, " ");
  if (!text) return "";
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

/** Count words in rich text (English-style whitespace split) */
export function countWords(html: string): number {
  const text = stripHtml(html);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}
