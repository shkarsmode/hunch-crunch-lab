import "server-only";

const buckets = new Map<string, { n: number; reset: number }>();

export function allow(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset <= now) {
    if (buckets.size > 20000) for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
    buckets.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  b.n += 1;
  return b.n <= max;
}
