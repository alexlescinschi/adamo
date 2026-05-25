import { NextRequest, NextResponse } from "next/server";
import { createPayment } from "@/lib/maib-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!process.env.MAIB_API_KEY || !process.env.MAIB_MERCHANT_ID) {
      return NextResponse.json(
        { error: "Maib merchants not configured. Contact maib to get API credentials." },
        { status: 503 }
      );
    }

    const data = await createPayment({
      amount: body.amount,
      currency: "MDL",
      description: body.description || "Comandă Adamo",
      orderId: body.orderId,
      redirectUrl: body.redirectUrl,
      callbackUrl: body.callbackUrl,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Maib payment error:", error);
    const message = error instanceof Error ? error.message : "Payment initiation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
