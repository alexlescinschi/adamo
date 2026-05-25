import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

export async function getCached<T>(key: string, fetcher: () => Promise<T>, ttlSeconds = 60): Promise<T> {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
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
