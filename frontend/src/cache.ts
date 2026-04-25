import type { IncidentListResponseDto } from "./dtos.js";

const CACHE_TTL_MS = 30_000;

interface CacheEntry {
  data: IncidentListResponseDto;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

export function cacheGet(key: string): IncidentListResponseDto | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function cacheSet(key: string, data: IncidentListResponseDto): void {
  store.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}
export function invalidateAll(): void {
  store.clear();
}