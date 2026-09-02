import { NextResponse } from "next/server";
import { isBpayConfigured } from "@/lib/bpay";
import { redis } from "@/lib/redis";

export async function GET() {
  return NextResponse.json({ enabled: isBpayConfigured() && Boolean(redis) });
}
