import { countWords, getPlainTextLength, isRichTextEmpty } from "./richText";

export function debounceSave<T>(fn: () => Promise<T>, delay = 1500) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => new Promise<T>((resolve, reject) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      try { resolve(await fn()); } catch (e) { reject(e); }
    }, delay);
  });
}

export function charCount(text: string) {
  return getPlainTextLength(text);
}

export function isOverLimit(text: string, max: number) {
  return charCount(text) > max;
}

export function wordCount(text: string) {
  return countWords(text);
}

export function isOverWordLimit(text: string, max: number) {
  return wordCount(text) > max;
}

export function isLogComplete(log: { work_content: string; task_completion: string; problems_solutions: string; reflection: string }) {
  return [log.work_content, log.task_completion, log.problems_solutions, log.reflection].every((f) => !isRichTextEmpty(f));
}
