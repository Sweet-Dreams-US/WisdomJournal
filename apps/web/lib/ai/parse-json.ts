/**
 * Parse JSON out of an LLM response.
 *
 * Models frequently wrap JSON in ```json fences or add a sentence around
 * it despite "return ONLY valid JSON" instructions. Strips fences first,
 * then falls back to the outermost bracket span before giving up.
 * Returns null instead of throwing.
 */
export function parseModelJson<T = unknown>(raw: string): T | null {
  if (!raw) return null;

  const stripped = raw
    .trim()
    .replace(/```json?\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(stripped) as T;
  } catch {
    // Fall back: grab the outermost JSON array/object span
    const start = stripped.search(/[[{]/);
    if (start === -1) return null;
    const lastBrace = Math.max(
      stripped.lastIndexOf("]"),
      stripped.lastIndexOf("}")
    );
    if (lastBrace <= start) return null;
    try {
      return JSON.parse(stripped.slice(start, lastBrace + 1)) as T;
    } catch {
      return null;
    }
  }
}
