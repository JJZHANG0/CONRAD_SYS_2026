/** Build a PATCH payload with only allowed keys; never send null/undefined. */
export function buildTextFormPayload<T extends string>(
  fields: readonly T[],
  data: Partial<Record<T, unknown>>,
  sanitize?: (value: string) => string
): Record<T, string> {
  const payload = {} as Record<T, string>;
  for (const field of fields) {
    const value = data[field];
    const raw = value == null ? "" : String(value);
    payload[field] = sanitize ? sanitize(raw) : raw;
  }
  return payload;
}

/** Build a single-field PATCH payload for auto-save on blur. */
export function buildSingleFieldPayload<T extends string>(
  field: T,
  data: Partial<Record<T, unknown>>,
  sanitize?: (value: string) => string
): Record<T, string> {
  const value = data[field];
  const raw = value == null ? "" : String(value);
  return { [field]: sanitize ? sanitize(raw) : raw } as Record<T, string>;
}
