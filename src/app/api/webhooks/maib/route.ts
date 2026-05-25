import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { updateOrderPaymentStatus } from "@/lib/crm-api";

const MAIB_WEBHOOK_SECRET = process.env.MAIB_WEBHOOK_SECRET || "";

function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(signature, "utf8"));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    if (MAIB_WEBHOOK_SECRET) {
      const signature = request.headers.get("x-maib-signature") || "";
      if (!verifySignature(rawBody, signature, MAIB_WEBHOOK_SECRET)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const { payId, status, orderId } = body;

    console.log(`Maib webhook: payId=${payId}, status=${status}, orderId=${orderId}`);

    if (status === "COMPLETED" || status === "PAID" || status === "SUCCESS") {
      if (orderId) {
        try {
          await updateOrderPaymentStatus(Number(orderId), "PAID");
          console.log(`Order ${orderId} marked as paid`);
        } catch (crmError) {
          console.error(`Failed to update order ${orderId} payment status:`, crmError);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Maib webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
