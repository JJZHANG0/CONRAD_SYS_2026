const PREFIX = "conrad-daily-log-draft-v1";

export interface LogDraft<T extends string> {
  fields: Record<T, string>;
  dirty: T[];
  updatedAt: number;
}

function key(logId: number): string {
  return `${PREFIX}:${logId}`;
}

export function loadLogDraft<T extends string>(logId: number): LogDraft<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(logId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LogDraft<T>;
    if (!parsed?.fields || !Array.isArray(parsed.dirty)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function storeLogDraft<T extends string>(
  logId: number,
  fields: Record<T, string>,
  dirty: Iterable<T>
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      key(logId),
      JSON.stringify({
        fields,
        dirty: Array.from(dirty),
        updatedAt: Date.now(),
      } satisfies LogDraft<T>)
    );
  } catch {
    // Storage may be unavailable in private mode; network saving still works.
  }
}

export function clearLogDraft(logId: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(logId));
  } catch {
    // Ignore unavailable storage.
  }
}
