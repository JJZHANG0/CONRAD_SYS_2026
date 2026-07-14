import { openGoogleTranslatePage, translateClientSide } from "@/utils/translateClient";

/**
 * 运营模块英→中：只在浏览器里翻译，不走后端、不申请任何 API Key。
 */
export async function translateText(text: string): Promise<string> {
  return translateClientSide(text);
}

export { openGoogleTranslatePage };
