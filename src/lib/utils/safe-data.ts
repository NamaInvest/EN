/**
 * Safe Data Utilities — Client-Side Runtime Protections
 * 
 * Prevents client-side crashes (e.g. ".map is not a function", "is not iterable")
 * due to unexpected API responses or null/undefined values.
 */

export function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;

    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.records)) return obj.records as T[];
    if (Array.isArray(obj.results)) return obj.results as T[];
    if (Array.isArray(obj.rows)) return obj.rows as T[];
  }

  return [];
}

export function toObject<T extends Record<string, unknown>>(
  value: unknown,
  fallback = {} as T
): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as T;
  }
  return fallback;
}

export function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function toStringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function hasArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}
