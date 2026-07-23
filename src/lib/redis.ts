import { Redis } from "@upstash/redis";

function createRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || "";
  if (!url.startsWith("https://")) return null;
  try {
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

export const redis = createRedis();

export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  if (!redis) return { allowed: process.env.NODE_ENV !== "production", remaining: limit };
  try {
    const count = await redis.eval<[string], number>(
      "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n",
      [key],
      [String(windowSeconds)],
    );
    return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
  } catch {
    return { allowed: process.env.NODE_ENV !== "production", remaining: limit };
  }
}

export async function getCached<T>(key: string, fetcher: () => Promise<T>, ttlSeconds = 60): Promise<T> {
  if (!redis) {
    return fetcher();
  }

  try {
    const cached = await redis.get<T>(key);
    if (cached) return cached;
  } catch {
    // ignore redis errors, fallback to fetcher
  }

  const data = await fetcher();

  try {
    await redis.set(key, data, { ex: ttlSeconds });
  } catch {
    // ignore redis errors
  }

  return data;
}
