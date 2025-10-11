const store = new Map<string, { data: any; expires: number }>();
const ttlMs = 86400000; // 24 hours
export function getCache(key: string) {
  const item = store.get(key.toLowerCase());
  if (!item || Date.now() > item.expires) return null;
  return item.data;
}
export function setCache(key: string, data: any) {
  store.set(key.toLowerCase(), { data, expires: Date.now() + ttlMs });
}
