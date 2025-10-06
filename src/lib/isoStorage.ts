export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, val: string): void;
  removeItem(key: string): void;
}
const mem = new Map<string, string>();
function memGet(k: string) { return mem.has(k) ? (mem.get(k) as string) : null; }
function memSet(k: string, v: string) { mem.set(k, v); }
function memDel(k: string) { mem.delete(k); }
const hasBrowser = typeof globalThis !== "undefined" && typeof (globalThis as any).window !== "undefined" && !!(globalThis as any).window.localStorage;

export const isoStorage: StorageLike = hasBrowser
  ? {
      // [iso-storage:start] browser-backed
      getItem: (k) => (globalThis as any).window.localStorage.getItem(k),
      setItem: (k, v) => (globalThis as any).window.localStorage.setItem(k, v),
      removeItem: (k) => (globalThis as any).window.localStorage.removeItem(k),
      // [iso-storage:end]
    }
  : {
      // Node fallback (per-process memory)
      getItem: memGet,
      setItem: memSet,
      removeItem: memDel,
    };
