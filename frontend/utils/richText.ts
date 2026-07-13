/** Strip HTML and return plain text for character counting */
export function stripHtml(html: string): string {
  if (!html) return "";
  if (typeof document === "undefined") {
    return html
      .replace(/<sc-clipboard[\s\S]*?<\/sc-clipboard>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
  }
  const div = document.createElement("div");
  div.innerHTML = sanitizeRichTextHtml(html);
  return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
}

/** Remove Feishu/Notion paste junk and unsafe markup before save or render. */
export function sanitizeRichTextHtml(html: string): string {
  if (!html) return "";
  let cleaned = html
    .replace(/<sc-clipboard[\s\S]*?<\/sc-clipboard>/gi, "")
    .replace(/<sc-clipboard[^>]*>/gi, "")
    .replace(/<\/?sc-clipboard[^>]*>/gi, "")
    .replace(/\sdata-[\w-]+="[^"]*"/gi, "")
    .replace(/\sdata-[\w-]+='[^']*'/gi, "")
    .replace(/<span[^>]*class="[^"]*css-[^"]*"[^>]*>/gi, "")
    .replace(/<\/span>/gi, " ");

  if (typeof document === "undefined") {
    return cleaned.replace(/\s+/g, " ").trim();
  }

  const div = document.createElement("div");
  div.innerHTML = cleaned;
  div.querySelectorAll("sc-clipboard").forEach((node) => node.remove());

  const text = (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return `<p>${text}</p>`;
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
  const text = stripHtml(html);
  if (!text) return "";
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

/** Count words in rich text (English-style whitespace split) */
export function countWords(html: string): number {
  const text = stripHtml(html);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}
