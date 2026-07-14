import { apiClient } from "./apiClient";
import { translateClientSide } from "@/utils/translateClient";

/**
 * Translate EN → ZH for operations review.
 * Tries browser-side MyMemory first (works with local VPN), then backend fallbacks.
 */
export async function translateText(text: string): Promise<string> {
  try {
    const clientResult = await translateClientSide(text);
    if (clientResult) return clientResult;
  } catch {
    // Server-side providers (Baidu / MyMemory / Google)
  }

  const { data } = await apiClient.post<{ translated: string }>("/translate/", { text });
  return data.translated || "";
}
