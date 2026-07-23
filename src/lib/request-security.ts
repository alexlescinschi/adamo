import "server-only";
import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/redis";

export async function isRateLimited(
  request: NextRequest,
  bucket: string,
  limit: number,
  windowSeconds: number,
  identity = "",
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const hash = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 32);
  const checks = [
    rateLimit(`rate:${bucket}:ip:${hash(ip)}`, limit, windowSeconds),
    rateLimit(`rate:${bucket}:global`, limit * 100, windowSeconds),
  ];
  if (identity) checks.push(rateLimit(`rate:${bucket}:identity:${hash(identity)}`, limit, windowSeconds));
  return (await Promise.all(checks)).some((result) => !result.allowed);
}

export function publicAuthResponse(data: Record<string, any>) {
  const safe = { ...data };
  delete safe.accessToken;
  delete safe.refreshToken;
  return safe;
}
