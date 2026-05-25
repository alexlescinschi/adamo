import { NextRequest, NextResponse } from "next/server";

const MAIB_WEBHOOK_SECRET = process.env.MAIB_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify webhook signature if configured
    if (MAIB_WEBHOOK_SECRET) {
      const signature = request.headers.get("x-maib-signature");
      // TODO: implement signature verification according to maib docs
    }

    const { payId, status, orderId } = body;

    console.log(`Maib webhook received: payId=${payId}, status=${status}, orderId=${orderId}`);

    // TODO: Update order status in CRM when payment is confirmed
    // This requires CRM integration to mark the deal as paid

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Maib webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
