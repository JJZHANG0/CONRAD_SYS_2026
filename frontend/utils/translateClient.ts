import { stripHtml } from "@/utils/richText";

const CHUNK_SIZE = 900;

type ChromeTranslator = {
  translate: (input: string) => Promise<string>;
  destroy?: () => void;
};

type TranslatorFactory = {
  availability: (options: {
    sourceLanguage: string;
    targetLanguage: string;
  }) => Promise<"unavailable" | "downloadable" | "downloading" | "available">;
  create: (options: {
    sourceLanguage: string;
    targetLanguage: string;
  }) => Promise<ChromeTranslator>;
};

declare global {
  interface Window {
    Translator?: TranslatorFactory;
  }
}

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

/** Chrome / Edge 内置本地翻译（无需任何密钥、不走服务器） */
async function translateWithChromeBuiltin(text: string): Promise<string | null> {
  const Translator = typeof window !== "undefined" ? window.Translator : undefined;
  if (!Translator?.availability || !Translator.create) return null;

  try {
    const availability = await Translator.availability({
      sourceLanguage: "en",
      targetLanguage: "zh-Hans",
    });
    if (availability === "unavailable") return null;

    const translator = await Translator.create({
      sourceLanguage: "en",
      targetLanguage: "zh-Hans",
    });
    try {
      const parts: string[] = [];
      for (const chunk of chunkText(text, 3500)) {
        parts.push(await translator.translate(chunk));
      }
      return parts.join("\n").trim() || null;
    } finally {
      translator.destroy?.();
    }
  } catch {
    return null;
  }
}

/** 浏览器直接请求 Google Translate（免注册，不经过我们服务器） */
async function translateChunkGoogle(text: string): Promise<string> {
  const params = new URLSearchParams({
    client: "gtx",
    sl: "en",
    tl: "zh-CN",
    dt: "t",
    q: text,
  });
  const res = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`, {
    method: "GET",
  });
  if (!res.ok) throw new Error(`Google HTTP ${res.status}`);
  const data = (await res.json()) as unknown;
  const parts: string[] = [];
  if (Array.isArray(data) && Array.isArray(data[0])) {
    for (const item of data[0]) {
      if (Array.isArray(item) && typeof item[0] === "string") parts.push(item[0]);
    }
  }
  const translated = parts.join("").trim();
  if (!translated) throw new Error("Google empty");
  return translated;
}

async function translateViaGoogle(text: string): Promise<string> {
  const parts: string[] = [];
  for (const chunk of chunkText(text, CHUNK_SIZE)) {
    parts.push(await translateChunkGoogle(chunk));
  }
  return parts.join("\n").trim();
}

/** 打开浏览器里的 Google 翻译页面（完全无接口、无密钥） */
export function openGoogleTranslatePage(htmlOrText: string): void {
  const text = stripHtml(htmlOrText).trim();
  if (!text || typeof window === "undefined") return;
  const url = `https://translate.google.com/?sl=en&tl=zh-CN&text=${encodeURIComponent(text.slice(0, 4500))}&op=translate`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * 纯浏览器翻译：不调用我们后端、不需要申请任何 API Key。
 * 1) Chrome 本地 Translator
 * 2) 浏览器直连 Google Translate
 */
export async function translateClientSide(htmlOrText: string): Promise<string> {
  const text = stripHtml(htmlOrText).trim();
  if (!text) return "";

  const builtin = await translateWithChromeBuiltin(text);
  if (builtin) return builtin;

  return translateViaGoogle(text);
}
