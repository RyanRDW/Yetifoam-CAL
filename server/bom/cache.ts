const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const suburbCache = new Map<string, CacheEntry<unknown>>();

function normaliseKey(suburb: string): string {
  return suburb.trim().toLowerCase();
}

export function getFromCache<T>(suburb: string): T | undefined {
  if (!suburb) {
    return undefined;
  }

  const key = normaliseKey(suburb);
  const entry = suburbCache.get(key);

  if (!entry) {
    return undefined;
  }

  if (Date.now() >= entry.expiresAt) {
    suburbCache.delete(key);
    return undefined;
  }

  return entry.value as T;
}

export function setInCache<T>(suburb: string, value: T): void {
  if (!suburb) {
    return;
  }

  const key = normaliseKey(suburb);
  suburbCache.set(key, {
    value,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function clearCache(): void {
  suburbCache.clear();
}

export const ttlMs = TTL_MS;
