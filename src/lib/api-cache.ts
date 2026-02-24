/**
 * API request deduplication, in-memory cache (TTL), and 429 exponential backoff.
 * Pure function layer — no React. Wraps fetch-based API calls transparently.
 */

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL_MS = 30_000;
const MAX_RETRIES = 2;
const BASE_BACKOFF_MS = 5_000;

const TTL_BY_PREFIX: Record<string, number> = {
  'world/snapshot': 30_000,
  'zone-progress': 60_000,
  'zone-consciousness': 60_000,
  'me-complexion': 120_000,
};

function ttlFor(key: string): number {
  for (const prefix of Object.keys(TTL_BY_PREFIX)) {
    if (key.includes(prefix)) return TTL_BY_PREFIX[prefix];
  }
  return DEFAULT_TTL_MS;
}

function cacheKey(method: string, path: string): string {
  return `${method}:${path}`;
}

export function clearApiCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}

/**
 * Wraps a fetch-based API function with dedup, cache, and 429 retry.
 * Only caches GET requests; POST/mutation requests get 429 retry only.
 */
export async function cachedRequest<T>(
  method: string,
  path: string,
  executeFn: () => Promise<{ data: T | null; error: string | null; status?: number }>,
  opts?: { skipCache?: boolean },
): Promise<{ data: T | null; error: string | null }> {
  const key = cacheKey(method, path);
  const isGet = method === 'GET';
  const ttl = ttlFor(path);

  if (isGet && !opts?.skipCache) {
    const cached = cache.get(key) as CacheEntry<{ data: T; error: null }> | undefined;
    if (cached && Date.now() - cached.ts < ttl) {
      return cached.data;
    }
  }

  const pending = inflight.get(key) as Promise<{ data: T | null; error: string | null }> | undefined;
  if (pending) return pending;

  const doFetch = async (attempt: number): Promise<{ data: T | null; error: string | null }> => {
    const result = await executeFn();

    if (result.status === 429 && attempt < MAX_RETRIES) {
      const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoff));
      return doFetch(attempt + 1);
    }

    if (result.data !== null && isGet) {
      cache.set(key, { data: { data: result.data, error: null }, ts: Date.now() });
    }

    return { data: result.data, error: result.error };
  };

  const promise = doFetch(0).finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  return promise;
}
