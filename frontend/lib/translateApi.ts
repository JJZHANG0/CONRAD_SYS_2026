import { apiClient } from "./apiClient";

export async function translateText(text: string): Promise<string> {
  const { data } = await apiClient.post<{ translated: string }>("/translate/", { text });
  return data.translated || "";
}
