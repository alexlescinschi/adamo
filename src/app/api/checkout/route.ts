import { NextRequest, NextResponse } from "next/server";
import { createOrder, type CheckoutPayload } from "@/lib/crm-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const payload: CheckoutPayload = {
      items: body.items,
      delivery_method: body.delivery_method,
      payment_method: body.payment_method,
      warehouse_id: body.warehouse_id,
      contact: body.contact,
      delivery: body.delivery,
      comment: body.comment,
    };

    const data = await createOrder(payload);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("API checkout error:", error);
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
