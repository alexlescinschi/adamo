import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  updateOrderStatusFromWebhook,
} from "@/lib/iute-api";

// ponytail: webhook IutePay — confirmation (PAID) și cancellation (CANCELLED).
// Header-e: x-iute-signature (base64, RSA-SHA256), x-iute-timestamp (epoch ms).
// Body: { orderId, description, loanAmount }.
//   - confirmation (userConfirmationUrl): loanAmount = number → status PAID
//   - cancellation  (userCancelUrl):      loanAmount = null   → status CANCELLED
// Status NU vine în body — se deduce din prezența/absența loanAmount.
// Reusește șablonul din /api/webhooks/maib.
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-iute-signature") || "";
    const timestamp = request.headers.get("x-iute-timestamp") || "";

    if (!signature || !timestamp) {
      return NextResponse.json(
        { error: "Missing signature headers" },
        { status: 401 }
      );
    }

    const ok = await verifyWebhookSignature(rawBody, signature, timestamp);
    if (!ok) {
      console.warn("[iute webhook] invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const orderId = body.orderId;
    const isCancellation = body.loanAmount == null;

    console.log(
      `[iute webhook] orderId=${orderId}, loanAmount=${body.loanAmount}, ` +
        `description=${body.description}, type=${isCancellation ? "CANCEL" : "CONFIRM"}`
    );

    if (orderId) {
      try {
        await updateOrderStatusFromWebhook(orderId, isCancellation);
      } catch (crmError) {
        // CRM fail nu întoarce 5xx către IutePay (ar reîncerca inutil dacă order e ok).
        console.error(
          `[iute webhook] CRM update failed for ${orderId}:`,
          crmError
        );
      }
    } else {
      console.warn("[iute webhook] payload fără orderId, ignor:", body);
    }

    // 2xx = confirmare primită.
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[iute webhook] error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
