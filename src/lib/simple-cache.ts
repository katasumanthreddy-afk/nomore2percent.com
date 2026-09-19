// A lightweight in-memory cache, scoped to a single warm server instance.
// Not a distributed cache (no Redis) — deliberately so, since at this
// system's actual scale (dozens of requirements, low hundreds of
// properties) the real cost isn't the database query itself, it's *several
// concurrent users triggering the same query redundantly at once*. This
// solves exactly that without adding new infrastructure. If traffic ever
// grows enough that cross-instance consistency matters, this is the first
// thing to swap for a real cache — not before.
const store = new Map<string, { value: unknown; expiresAt: number }>();

export async function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as T;
  }
  const value = await fetcher();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

// Call after any write that should invalidate a cached read immediately —
// e.g. adding a property should clear the properties list cache so the
// very next read reflects it, without waiting out the TTL.
export function invalidateCache(key: string) {
  store.delete(key);
}
