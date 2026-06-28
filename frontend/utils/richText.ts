/** Strip HTML and return plain text for character counting */
export function stripHtml(html: string): string {
  if (!html) return "";
  if (typeof document === "undefined") {
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
}

export function getPlainTextLength(html: string): number {
  return stripHtml(html).length;
}

export function isRichTextEmpty(html: string): boolean {
  return getPlainTextLength(html) === 0;
}

/** Normalize editor output — empty content becomes "" */
export function normalizeRichText(html: string): string {
  if (isRichTextEmpty(html)) return "";
  return html;
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
