import { NextRequest, NextResponse } from "next/server";
import {
  getOrderStatus,
  isPaidStatus,
  isCancelledStatus,
  IUTE_CONFIGURED,
} from "@/lib/iute-api";

export const dynamic = "force-dynamic";

// ponytail: poll status comandă IutePay. Folosit din pagina de return + viitor cron.
// GET ?orderId=123 → { status, paid, cancelled }
export async function GET(request: NextRequest) {
  try {
    if (!IUTE_CONFIGURED) {
      return NextResponse.json(
        { error: "IutePay not configured" },
        { status: 503 }
      );
    }

    const orderId = request.nextUrl.searchParams.get("orderId");
    if (!orderId) {
      return NextResponse.json(
        { error: "Missing orderId" },
        { status: 400 }
      );
    }

    const data = await getOrderStatus(orderId);
    const status = String(data?.status || "").toUpperCase();

    return NextResponse.json({
      status,
      paid: isPaidStatus(status),
      cancelled: isCancelledStatus(status),
      approvedAmount: data?.approvedAmount,
      raw: data,
    });
  } catch (error) {
    console.error("[iute status] error:", error);
    const message =
      error instanceof Error ? error.message : "Status check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
