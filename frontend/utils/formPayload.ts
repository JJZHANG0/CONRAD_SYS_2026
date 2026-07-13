/** Build a PATCH payload with only allowed keys; never send null/undefined. */
export function buildTextFormPayload<T extends string>(
  fields: readonly T[],
  data: Partial<Record<T, unknown>>
): Record<T, string> {
  const payload = {} as Record<T, string>;
  for (const field of fields) {
    const value = data[field];
    payload[field] = value == null ? "" : String(value);
  }
  return payload;
}
