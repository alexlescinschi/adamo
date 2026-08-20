import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getOrderInvoice } from "@/lib/crm-api";
import { isRateLimited } from "@/lib/request-security";
import { redis } from "@/lib/redis";

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 10_000) return NextResponse.json({ error: "Request too large" }, { status: 413 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const invoiceHandle = typeof body?.invoiceHandle === "string" ? body.invoiceHandle.trim() : "";
  const receiptHandle = typeof body?.receiptHandle === "string" ? body.receiptHandle.trim() : "";
  if (!/^[a-zA-Z0-9_-]{40,64}$/.test(invoiceHandle || receiptHandle)) {
    return NextResponse.json({ error: "Invalid invoice request" }, { status: 400 });
  }
  if (!redis) return NextResponse.json({ error: "Invoice is temporarily unavailable" }, { status: 503 });
  if (await isRateLimited(request, "invoice", 10, 600, invoiceHandle || receiptHandle)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    let handle = invoiceHandle;
    if (!handle) {
      const receiptKey = createHash("sha256").update(receiptHandle).digest("hex").slice(0, 32);
      const receipt = await redis.get<{ invoiceHandle?: string }>(`receipt:v1:${receiptKey}`);
      handle = receipt?.invoiceHandle || "";
    }
    if (!handle) return NextResponse.json({ error: "Invoice link expired" }, { status: 404 });
    const key = createHash("sha256").update(handle).digest("hex").slice(0, 32);
    const invoiceRequest = await redis.get<{ orderId: number; accessToken: string }>(`invoice:v1:${key}`);
    if (!invoiceRequest) return NextResponse.json({ error: "Invoice link expired" }, { status: 404 });
    const invoice = await getOrderInvoice(invoiceRequest.orderId, invoiceRequest.accessToken);
    return NextResponse.json(invoice, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Invoice is temporarily unavailable" }, { status: 502 });
  }
}
