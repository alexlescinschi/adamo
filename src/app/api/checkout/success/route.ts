import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/request-security";
import { redis } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get("receipt") || "";
  if (!/^[a-zA-Z0-9_-]{40,64}$/.test(handle)) {
    return NextResponse.json({ error: "Invalid receipt" }, { status: 400 });
  }
  if (!redis) return NextResponse.json({ error: "Receipt unavailable" }, { status: 503 });
  if (await isRateLimited(request, "checkout-receipt", 30, 600, handle)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const key = createHash("sha256").update(handle).digest("hex").slice(0, 32);
  const receipt = await redis.get<Record<string, unknown>>(`receipt:v1:${key}`);
  if (!receipt) return NextResponse.json({ error: "Receipt expired" }, { status: 404 });

  const publicReceipt = { ...receipt };
  delete publicReceipt.invoiceHandle;
  return NextResponse.json(publicReceipt, { headers: { "Cache-Control": "no-store" } });
}
