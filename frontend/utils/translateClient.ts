import { stripHtml } from "@/utils/richText";

const CHUNK_SIZE = 450;

function chunkText(text: string, size = CHUNK_SIZE): string[] {
  if (text.length <= size) return text ? [text] : [];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + size, text.length);
    if (end < text.length) {
      const window = text.slice(start, end);
      const breakAt = Math.max(
        window.lastIndexOf("。"),
        window.lastIndexOf("."),
        window.lastIndexOf("!"),
        window.lastIndexOf("?"),
        window.lastIndexOf(" ")
      );
      if (breakAt > size / 3) end = start + breakAt + 1;
    }
    const piece = text.slice(start, end).trim();
    if (piece) chunks.push(piece);
    start = end;
  }
  return chunks;
}

async function translateChunkMyMemory(text: string): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-CN`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const data = (await res.json()) as {
    responseData?: { translatedText?: string };
  };
  const translated = data.responseData?.translatedText?.trim() || "";
  if (!translated || translated === text) {
    throw new Error("MyMemory returned empty result");
  }
  if (translated.toUpperCase().includes("QUERY LENGTH LIMIT")) {
    throw new Error("MyMemory chunk too long");
  }
  return translated;
}

/** Browser-side translation — uses the operator's network (often with VPN), bypassing server blocks. */
export async function translateClientSide(htmlOrText: string): Promise<string> {
  const text = stripHtml(htmlOrText).trim();
  if (!text) return "";

  const parts: string[] = [];
  for (const chunk of chunkText(text)) {
    parts.push(await translateChunkMyMemory(chunk));
  }
  return parts.join("\n").trim();
}
